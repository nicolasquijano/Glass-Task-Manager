package main

import (
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "Glass Monitor",
		Width:  350,
		Height: 450,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		// Make window transparent and frameless
		BackgroundColour: &options.RGBA{R: 255, G: 255, B: 255, A: 0},
		Frameless:        true,
		Windows: &windows.Options{
			WindowIsTranslucent:               true,
			BackdropType:                      windows.Acrylic,
			WebviewIsTransparent:              true,
			DisableFramelessWindowDecorations: true,
		},
		OnStartup:  app.startup,
		OnShutdown: app.shutdown,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
