// Command gitlimp-update is the self-update helper for GitLiMP.
//
// The main app spawns this process when an update is available, passing the
// path to the running executable, the download URL, and the app's PID. This
// helper downloads the new binary, waits for the main process to exit (so the
// running exe is no longer locked), replaces it, and relaunches the app.
//
// Usage:
//
//	gitlimp-update --target <exe-path> --url <download-url> --pid <pid>
package main

import (
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"time"
)

var (
	flagTarget = flag.String("target", "", "path to the executable to replace")
	flagURL    = flag.String("url", "", "URL of the new binary to download")
	flagPID    = flag.Int("pid", 0, "PID of the running app to wait for")
	flagWait   = flag.Duration("wait", 30*time.Second, "how long to wait for the app to exit")
)

func fail(format string, args ...interface{}) {
	fmt.Fprintf(os.Stderr, "gitlimp-update: "+format+"\n", args...)
	os.Exit(1)
}

// processRunning reports whether the given PID is still alive.
func processRunning(pid int) bool {
	if pid <= 0 {
		return false
	}
	p, err := os.FindProcess(pid)
	if err != nil {
		return false
	}
	// Sending signal 0 only checks existence; not supported on Windows.
	if runtime.GOOS == "windows" {
		// FindProcess on Windows always succeeds; probe by opening a handle.
		return processRunningWindows(pid)
	}
	err = p.Signal(os.Signal(syscallSignalZero))
	return err == nil
}

// waitForExit polls until the main process exits or the timeout elapses.
func waitForExit(pid int, timeout time.Duration) bool {
	if pid <= 0 {
		return true
	}
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		if !processRunning(pid) {
			return true
		}
		time.Sleep(250 * time.Millisecond)
	}
	return !processRunning(pid)
}

func download(url, dest string) error {
	resp, err := http.Get(url)
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("server returned %s", resp.Status)
	}
	out, err := os.Create(dest)
	if err != nil {
		return err
	}
	defer out.Close()
	if _, err := io.Copy(out, resp.Body); err != nil {
		return fmt.Errorf("download failed: %w", err)
	}
	return nil
}

func main() {
	flag.Parse()

	if *flagTarget == "" {
		fail("--target is required")
	}
	if *flagURL == "" {
		fail("--url is required")
	}
	if *flagPID <= 0 {
		fail("--pid is required")
	}

	dir := filepath.Dir(*flagTarget)
	tmp := filepath.Join(dir, ".gitlimp-update.tmp")

	if err := download(*flagURL, tmp); err != nil {
		fail("download: %v", err)
	}

	if !waitForExit(*flagPID, *flagWait) {
		os.Remove(tmp)
		fail("app did not exit within %v; aborting", *flagWait)
	}

	// Give the OS a moment to fully release the file handle.
	time.Sleep(300 * time.Millisecond)

	if err := os.Rename(tmp, *flagTarget); err != nil {
		os.Remove(tmp)
		fail("replace %s: %v", *flagTarget, err)
	}

	// Relaunch the app.
	cmd := exec.Command(*flagTarget)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Start(); err != nil {
		fail("relaunch: %v", err)
	}
}