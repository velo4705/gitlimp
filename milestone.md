# GitLiMP — Milestones

**Git Live Markdown Previewer** — a lightweight offline GUI that previews markdown files exactly as GitHub renders them, updating live on each edit.

Tech stack: **Go + Wails v2** | Frontend: **vanilla JS + markdown-it + github-markdown-css** | No JS framework.

## M0 — Environment & Scaffold
- [x] Install Go, Node.js, Wails CLI (`go install github.com/wailsapp/wails/v2/cmd/wails@latest`)
- [x] Verify Linux deps (webkit2gtk) / Windows (WebView2 preinstalled) — WebView2 confirmed (151.0.4129.72); Linux pending
- [x] `wails init` scaffold, confirm empty window launches on Windows and Linux — confirmed on Windows (10.9 MB binary); Linux pending

## M1 — Load & Render
- [x] Native file dialog to pick a `.md` file from any project
- [x] Read file in Go, pass content to frontend
- [x] Render with `markdown-it` (gfm + html enabled) + `github-markdown-css`
- [x] Verify GitHub-rich output: headings, tables, code blocks, buttons, HTML tags, shields.io badges (online)
- [x] Handle load errors (missing file, unreadable file, permission) with a clear message

## M2 — Live Preview
- [x] `fsnotify` watcher on the selected file in a Go goroutine
- [x] Debounced (~200 ms) change event → frontend re-render
- [x] Re-render only the preview pane; preserve scroll position where reasonable
- [x] Detect file deletion / rename and show a friendly "file unavailable" state
- [x] Add a manual "Refresh" fallback

## M2.5 — Multi-Document Workspace
- [x] "Open File..." (menu/toolbar) adds documents to the session; GitLiMP is pure preview — editing stays in the user's own editor
- [x] Tab bar: open/close multiple documents, one watcher per open tab
- [x] Split view: show two documents side-by-side, each live-updating
- [x] Split layouts: single | horizontal split (toggle); vertical split not yet wired
- [x] Per-tab state: content, scroll position, error state preserved on switch
- [x] Active tab indicator per tab; "modified" dot wired but inert (pure preview — no in-app edits trigger it)
- [x] Watcher lifecycle: stop watching when a tab closes, clean goroutines
- [x] Recent Files list (menu + keyboard shortcut): shows last-opened documents so you can jump back to a preview
- [x] Recent Files persisted (config file) across app restarts, deduplicated, capped (15), re-ordered on open
- [x] Per-pane independent tab bars in split view — each side has its own tabs and selection
- [x] Drag & drop tabs: reorder within a pane, or move a tab across panes in split view
- [x] Scroll position preserved on live re-render (auto-follow when pinned to bottom)
- [x] Status bar shows "Opened <name> — <full path>" with hover tooltip
- [x] Empty-state screen centered

## M4 — Lightweight & Polish
- [x] Strip build: `wails build -trimpath -ldflags "-s -w"` — 11.75 → 11.73 MB (marginal; size dominated by Go runtime + embedded WebView2 loader, not symbols). UPX not installed — optional follow-up for ~50% further reduction
- [x] No frontend framework, minimal dependency set — vanilla JS + markdown-it + github-markdown-css; Go direct deps only debounce, fsnotify, uuid, wails
- [x] Debounced render for large files — 200 ms debounce in Go watcher (`app.go`); renders only the affected pane
- [x] Dark mode matching GitHub dark theme (prefers-color-scheme) — `github-markdown-css` auto-switches; UI vars in `style.css` mirror it
- [x] App icon (orange diamond + M, 512 px), window title "GitLiMP", default window 1024×768
- [x] Measure and record baseline numbers — see below

### M4 baseline measurements (Windows, 2026-08-14)
| Metric | Value |
|---|---|
| Binary size (stripped `-s -w -trimpath`) | 11.73 MB (core) → 16.76 MB (with mermaid/katex/hljs) |
| frontend/dist embedded assets | 0.92 MB core → ~2.6 MB with diagram/katex chunks (mermaid lazy-loads) |
| Idle memory (working set) | ~33.8 MB core → ~39.6 MB with render libs |
| Go direct dependencies | 4 (debounce, fsnotify, uuid, wails) |

## M5 — Packaging & Release
- [x] Windows: NSIS installer built (`build/bin/gitlimp-amd64-installer.exe`, 8.34 MB, embeds WebView2 bootstrapper)
- [x] Linux: AppImage + .deb (Ubuntu/Debian) + .rpm (Fedora) + Flatpak (covers Arch)
- [x] GitHub Actions workflow: tag-triggered build of Windows (exe+installer), Linux (.deb+AppImage), RPM (Fedora container), Flatpak; publish to release
- [ ] README with usage, screenshots, and measured footprint
- [ ] Tag v0.1.0 release with artifacts for both platforms

## M6 — Web Demo
Interactive browser demo showing how GitLiMP is used as a markdown previewer.
Same look & feel as the desktop app, but running in the web browser.
- [x] Mock the Wails backend for the browser: `demo/src/mock.js` stubs `App` bindings + runtime (file open via `<input type=file>`, version/update canned, `BrowserOpenURL` → `window.open`)
- [x] Bundle the existing frontend for the web: shared `frontend/src/markdown.js` pipeline (markdown-it + mermaid + katex + hljs), Vite web build (`npm run build:demo`) into `docs/`
- [x] Demo content: playground ("playground.md" / "cheatsheet.md" samples) + side-by-side editor pane so visitors can edit and watch the live preview
- [x] Deployable static site: built to `docs/`, GitHub Pages from `/docs` on `main` → https://velo4705.github.io/gitlimp/
- [x] Download button: OS detection (`navigator.userAgent`), links to `releases/latest/download/<asset>` per platform
- [x] Star button: link to the GitHub repo
- [ ] README link + badge pointing to the live demo

## M7 — Auto-Update
Staged self-update via a launcher process (avoids the running-exe file lock).
- [ ] `gitlimp-update` helper binary (pure Go CLI): download to temp, wait for main process to exit, replace exe, relaunch
- [ ] Check-on-startup: query GitHub `releases/latest`, compare version, show "Update Available" banner
- [ ] "Download update" → spawn updater with `--target/--url/--pid`, app exits
- [ ] Bundle updater inside main binary (Go embed) or alongside it
- [ ] Build both binaries in one `wails build` (custom hook/script)
- [ ] SmartScreen/AV caveat: unsigned self-replacing binary; signing deferred unless release rollout needs it
