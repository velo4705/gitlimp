# Contributing to GitLiMP

Thanks for considering contributing to **GitLiMP**! All types of contributions are welcome — bug reports, feature suggestions, documentation, and code.

By participating in this project, you agree to uphold our [Code of Conduct](CODE_OF_CONDUCT.md). Please report any unacceptable behavior to [the repository maintainer](mailto:velocity4293@gmail.com).

## Development Prerequisites

- **Go 1.25+**
- **Node.js 20+**
- **Wails CLI v2** — `go install github.com/wailsapp/wails/v2/cmd/wails@v2.14.0`
- **Windows:** WebView2 runtime (preinstalled on Windows 11 / most Windows 10)
- **Linux:** `webkit2gtk-4.1` and GTK3 development packages

## Development Setup and Workflow

Clone and build:

```bash
git clone https://github.com/velo4705/gitlimp.git
cd gitlimp
```

```powershell
# Windows — builds the updater helper + the app
.\build.ps1
```

```bash
# Linux — builds the updater helper + the app
./build.sh
```

The scripts build the `gitlimp-update` helper (`cmd/updater`) first, then the main app via `wails build`. Outputs land in `build/bin/`.

**Making changes**

1. Fork the repository and clone your fork.
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Install Go dependencies: `go mod download`
4. Install frontend dependencies: `cd frontend && npm install`
5. Make your change. Keep the two frontends in sync: `frontend/src/markdown.js` is the shared rendering pipeline used by both the desktop app and the web playground — they must render identically.
6. Validate locally:
   ```bash
   go vet ./...
   go build ./...
   cd frontend && npm run build && npm run build:demo
   ```
7. Rebuild the app with `build.ps1` / `build.sh` to confirm it launches.

The app version comes from `version.json` at the project root (CI rewrites it from the release tag) — don't hardcode versions in code.

## Commit and PR Guidelines

**Commit messages**

We follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification:

```
<type>(<scope>): <description>
```

Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`.

Examples:

- `feat: add vertical split layout`
- `fix(app): reset status bar after closing last tab`
- `docs: update building instructions`

**Pull requests**

1. Rebase your branch on `main` before opening the PR.
2. Open the PR against `main` and fill out the [template](.github/pull_request_template.md) completely.
3. Squash your commits into one logical commit per change.
4. Address review feedback promptly; a maintainer merges once approved.

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).