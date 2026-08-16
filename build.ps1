# Builds the GitLiMP updater helper then the main Wails app.
# The updater ships alongside gitlimp.exe so auto-update can replace it.
$ErrorActionPreference = 'Stop'

$env:Path = "C:\Program Files\Go\bin;$env:USERPROFILE\go\bin;" + $env:Path

Write-Host "=== Building updater (cmd/updater) ==="
go build -trimpath -ldflags "-s -w" -o build/bin/gitlimp-update.exe ./cmd/updater

Write-Host "=== Building main app (wails) ==="
wails build -trimpath -ldflags "-s -w"

Write-Host "Done."