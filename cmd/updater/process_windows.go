//go:build windows

package main

import "syscall"

// processRunningWindows checks whether a Windows process is alive by probing
// its exit code via the Windows API.
func processRunningWindows(pid int) bool {
	handle, err := syscall.OpenProcess(syscall.PROCESS_QUERY_INFORMATION, false, uint32(pid))
	if err != nil {
		return false
	}
	defer syscall.CloseHandle(handle)
	var code uint32
	if err := syscall.GetExitCodeProcess(handle, &code); err != nil {
		return false
	}
	// STILL_ACTIVE (259) means the process has not exited.
	return code == 259
}