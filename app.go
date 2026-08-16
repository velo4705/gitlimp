package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"mime"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	goruntime "runtime"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/bep/debounce"
	"github.com/fsnotify/fsnotify"
	"github.com/google/uuid"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const (
	eventFileChanged = "file:changed"
	eventFileGone    = "file:gone"
	debounceDelay    = 200 * time.Millisecond
	maxRecent        = 15
	recentFile       = "recent.json"
)

// App struct
type App struct {
	ctx      context.Context
	mu       sync.Mutex
	watchers map[string]*fsnotify.Watcher // tabID → watcher
	paths    map[string]string            // tabID → path
	version  string
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		watchers: make(map[string]*fsnotify.Watcher),
		paths:    make(map[string]string),
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// FileContent holds a loaded markdown file's data
type FileContent struct {
	Path    string
	Name    string
	Content string
	Error   string
	TabID   string
}

// FileEvent is emitted when a watched file changes on disk
type FileEvent struct {
	TabID   string
	Content string
}

// FileGoneEvent is emitted when a watched file is deleted or renamed
type FileGoneEvent struct {
	TabID string
}

// OpenFile opens a native file dialog and loads the selected markdown file
func (a *App) OpenFile() *FileContent {
	path, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Open Markdown File",
		Filters: []runtime.FileFilter{
			{DisplayName: "Markdown", Pattern: "*.md;*.markdown"},
			{DisplayName: "All Files", Pattern: "*.*"},
		},
	})
	if err != nil {
		return &FileContent{Error: "Failed to open file dialog: " + err.Error()}
	}
	if path == "" {
		return nil
	}
	return a.LoadFile(path)
}

// LoadFile reads the markdown file at the given path and starts watching it
func (a *App) LoadFile(path string) *FileContent {
	if path == "" {
		return nil
	}
	a.mu.Lock()
	for id, p := range a.paths {
		if p == path {
			a.mu.Unlock()
			return a.rebuildContent(id, path)
		}
	}
	a.mu.Unlock()

	content, err := os.ReadFile(path)
	if err != nil {
		return &FileContent{Path: path, Name: filepath.Base(path), Error: "Couldn't read file: " + err.Error()}
	}
	tabID := uuid.New().String()
	a.startWatcher(tabID, path)
	a.addRecent(path)
	return &FileContent{
		Path:    path,
		Name:    filepath.Base(path),
		Content: string(content),
		TabID:   tabID,
	}
}

func (a *App) rebuildContent(tabID, path string) *FileContent {
	content, err := os.ReadFile(path)
	if err != nil {
		return &FileContent{Path: path, Name: filepath.Base(path), Error: "Couldn't read file: " + err.Error(), TabID: tabID}
	}
	return &FileContent{
		Path:    path,
		Name:    filepath.Base(path),
		Content: string(content),
		TabID:   tabID,
	}
}

// CloseTab stops watching the given tab and cleans up resources
func (a *App) CloseTab(tabID string) {
	a.stopWatcher(tabID)
}

// GetTabPath returns the file path for a given tab ID
func (a *App) GetTabPath(tabID string) string {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.paths[tabID]
}

// --- Watcher management ---

func (a *App) startWatcher(tabID, path string) {
	a.stopWatcher(tabID)

	dir := filepath.Dir(path)

	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		runtime.LogErrorf(a.ctx, "fsnotify: %v", err)
		return
	}
	if err := watcher.Add(dir); err != nil {
		watcher.Close()
		runtime.LogErrorf(a.ctx, "watch %s: %v", dir, err)
		return
	}

	a.mu.Lock()
	a.watchers[tabID] = watcher
	a.paths[tabID] = path
	a.mu.Unlock()

	go a.watchLoop(watcher, tabID, path)
}

func (a *App) watchLoop(watcher *fsnotify.Watcher, tabID, path string) {
	debounced := debounce.New(debounceDelay)

	for {
		select {
		case ev, ok := <-watcher.Events:
			if !ok {
				return
			}
			if ev.Name != path {
				continue
			}
			switch {
			case ev.Op&(fsnotify.Write|fsnotify.Create) != 0:
				debounced(func() {
					content, err := os.ReadFile(path)
					if err != nil {
						return
					}
					runtime.EventsEmit(a.ctx, eventFileChanged, FileEvent{
						TabID:   tabID,
						Content: string(content),
					})
				})
			case ev.Op&(fsnotify.Remove|fsnotify.Rename) != 0:
				runtime.EventsEmit(a.ctx, eventFileGone, FileGoneEvent{TabID: tabID})
				debounced(func() {})
			}
		case err, ok := <-watcher.Errors:
			if !ok {
				return
			}
			runtime.LogErrorf(a.ctx, "fsnotify error: %v", err)
		}
	}
}

func (a *App) stopWatcher(tabID string) {
	a.mu.Lock()
	defer a.mu.Unlock()
	if w, ok := a.watchers[tabID]; ok {
		w.Close()
		delete(a.watchers, tabID)
	}
	delete(a.paths, tabID)
}

// --- Recent files ---

type RecentEntry struct {
	Path string `json:"path"`
	Name string `json:"name"`
}

func (a *App) recentPath() string {
	dir, err := os.UserConfigDir()
	if err != nil {
		dir = os.TempDir()
	}
	appDir := filepath.Join(dir, "gitlimp")
	os.MkdirAll(appDir, 0755)
	return filepath.Join(appDir, recentFile)
}

func (a *App) addRecent(path string) {
	entries := a.GetRecentFiles()
	name := filepath.Base(path)
	filtered := make([]RecentEntry, 0, len(entries))
	for _, e := range entries {
		if e.Path != path {
			filtered = append(filtered, e)
		}
	}
	filtered = append([]RecentEntry{{Path: path, Name: name}}, filtered...)
	if len(filtered) > maxRecent {
		filtered = filtered[:maxRecent]
	}
	data, _ := json.MarshalIndent(filtered, "", "  ")
	os.WriteFile(a.recentPath(), data, 0644)
}

// GetRecentFiles returns the list of recently opened files
func (a *App) GetRecentFiles() []RecentEntry {
	data, err := os.ReadFile(a.recentPath())
	if err != nil {
		return nil
	}
	var entries []RecentEntry
	if err := json.Unmarshal(data, &entries); err != nil {
		return nil
	}
	return entries
}

// ClearRecentFiles empties the recent files list
func (a *App) ClearRecentFiles() {
	os.Remove(a.recentPath())
}

// --- Image path resolution ---

var imgTagRe = regexp.MustCompile(`<img[^>]*\bsrc="([^"]*)"[^>]*>`)
var sourceTagRe = regexp.MustCompile(`<source[^>]*\bsrcset="([^"]*)"[^>]*>`)
var imgSrcAttrRe = regexp.MustCompile(`src="([^"]*)"`)
var sourceSrcsetRe = regexp.MustCompile(`srcset="([^"]*)"`)

// ResolveImagePaths scans rendered HTML for <img> tags with local (non-http)
// src paths, reads the referenced files, and replaces their src with inline
// base64 data URIs so images render offline.
func (a *App) ResolveImagePaths(markdownFilePath string, html string) string {
	if markdownFilePath == "" {
		return html
	}
	dir := filepath.Dir(markdownFilePath)

	resolveSrc := func(src string) string {
		if strings.HasPrefix(src, "http://") || strings.HasPrefix(src, "https://") || strings.HasPrefix(src, "data:") {
			return src
		}
		abs := filepath.Join(dir, src)
		data, err := os.ReadFile(abs)
		if err != nil {
			return src
		}
		ext := strings.ToLower(filepath.Ext(abs))
		mimeType := mime.TypeByExtension(ext)
		if mimeType == "" {
			mimeType = "application/octet-stream"
		}
		b64 := base64.StdEncoding.EncodeToString(data)
		return fmt.Sprintf("data:%s;base64,%s", mimeType, b64)
	}

	// Resolve <img src="...">
	html = imgTagRe.ReplaceAllStringFunc(html, func(match string) string {
		parts := imgSrcAttrRe.FindStringSubmatch(match)
		if len(parts) < 2 {
			return match
		}
		resolved := resolveSrc(parts[1])
		return strings.Replace(match, parts[1], resolved, 1)
	})

	// Resolve <source srcset="...">
	html = sourceTagRe.ReplaceAllStringFunc(html, func(match string) string {
		parts := sourceSrcsetRe.FindStringSubmatch(match)
		if len(parts) < 2 {
			return match
		}
		resolved := resolveSrc(parts[1])
		return strings.Replace(match, parts[1], resolved, 1)
	})

	return html
}

func (a *App) IsMarkdown(path string) bool {
	ext := strings.ToLower(filepath.Ext(path))
	return ext == ".md" || ext == ".markdown"
}

// GetVersion returns the current app version
func (a *App) GetVersion() string {
	return a.version
}

// UpdateInfo holds the result of a version check
type UpdateInfo struct {
	Current      string `json:"current"`
	Latest       string `json:"latest"`
	Available    bool   `json:"available"`
	HTMLURL      string `json:"html_url"`
	DownloadURL  string `json:"download_url"`
	Error        string `json:"error"`
}

// CheckForUpdates queries the GitHub releases API and compares the latest
// tag against the running version. When an update is available it also
// resolves the download URL for the current platform's binary.
func (a *App) CheckForUpdates() UpdateInfo {
	info := UpdateInfo{Current: a.version}

	resp, err := http.Get("https://api.github.com/repos/velo4705/gitlimp/releases/latest")
	if err != nil {
		info.Error = err.Error()
		return info
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		info.Error = err.Error()
		return info
	}

	if resp.StatusCode != 200 {
		info.Error = "no releases yet"
		return info
	}

	var release struct {
		TagName string `json:"tag_name"`
		HTMLURL string `json:"html_url"`
		Assets  []struct {
			Name               string `json:"name"`
			BrowserDownloadURL string `json:"browser_download_url"`
		} `json:"assets"`
	}
	if err := json.Unmarshal(body, &release); err != nil {
		info.Error = "failed to parse response"
		return info
	}

	info.Latest = release.TagName
	info.HTMLURL = release.HTMLURL
	info.Available = release.TagName != "" && normalizeVersion(release.TagName) != normalizeVersion(a.version)
	if info.Available {
		info.DownloadURL = a.matchAsset(release.Assets)
	}
	return info
}

// normalizeVersion strips a leading "v" and trims whitespace so a tag like
// "v1.0.0" compares equal to a version.json value like "1.0.0".
func normalizeVersion(v string) string {
	return strings.TrimSpace(strings.TrimPrefix(strings.TrimSpace(v), "v"))
}

// matchAsset picks the raw executable asset for the current platform from the
// release assets, preferring the plain binary over installers (the updater
// replaces the running exe, it cannot install into Program Files).
func (a *App) matchAsset(assets []struct {
	Name               string `json:"name"`
	BrowserDownloadURL string `json:"browser_download_url"`
}) string {
	want := map[string]string{
		"windows": "gitlimp.exe",
		"linux":   "gitlimp",
	}[a.platform()]
	for _, asset := range assets {
		if want != "" && asset.Name == want {
			return asset.BrowserDownloadURL
		}
	}
	if len(assets) > 0 {
		return assets[0].BrowserDownloadURL
	}
	return ""
}

// platform returns the runtime OS short name used to match release assets.
func (a *App) platform() string {
	return goruntime.GOOS
}

// updaterName returns the file name of the updater helper for the current
// platform. It ships alongside the main executable.
func updaterName() string {
	if goruntime.GOOS == "windows" {
		return "gitlimp-update.exe"
	}
	return "gitlimp-update"
}

// DownloadUpdate spawns the updater helper to download and apply the latest
// release, then exits the app so the running exe is unlocked for replacement.
// The updater binary must live next to the running executable.
func (a *App) DownloadUpdate(url string) error {
	if url == "" {
		return fmt.Errorf("no download URL")
	}
	exe, err := os.Executable()
	if err != nil {
		return fmt.Errorf("resolve executable: %w", err)
	}
	updater := filepath.Join(filepath.Dir(exe), updaterName())
	if _, err := os.Stat(updater); err != nil {
		return fmt.Errorf("updater not found next to %s: %w", exe, err)
	}
	cmd := exec.Command(updater, "--target", exe, "--url", url, "--pid", strconv.Itoa(os.Getpid()))
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("start updater: %w", err)
	}
	// Give the updater a moment to start, then exit so the exe unlocks.
	go func() {
		time.Sleep(2 * time.Second)
		os.Exit(0)
	}()
	return nil
}
