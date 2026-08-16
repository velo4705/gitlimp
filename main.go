package main

import (
	"embed"
	"encoding/json"
	"os"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed version.json
var versionJSON []byte

func main() {
	// Read version from version.json
	version := "dev"
	if data, err := os.ReadFile("version.json"); err == nil {
		var v struct{ Version string `json:"version"` }
		if json.Unmarshal(data, &v) == nil && v.Version != "" {
			version = v.Version
		}
	} else if len(versionJSON) > 0 {
		// Embedded fallback
		var v struct{ Version string `json:"version"` }
		if json.Unmarshal(versionJSON, &v) == nil && v.Version != "" {
			version = v.Version
		}
	}

	// Create an instance of the app structure
	app := NewApp()
	app.version = version

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "GitLiMP",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
