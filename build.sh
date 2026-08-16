#!/usr/bin/env bash
# Builds the GitLiMP updater helper then the main Wails app (Linux).
set -euo pipefail

export PATH="$HOME/go/bin:$PATH"

echo "=== Building updater (cmd/updater) ==="
go build -trimpath -ldflags "-s -w" -o build/bin/gitlimp-update ./cmd/updater

echo "=== Building main app (wails) ==="
wails build -trimpath -ldflags "-s -w" -tags webkit2_41

echo "Done."