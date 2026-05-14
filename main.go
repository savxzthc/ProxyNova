package main

import (
	"embed"

	"proxynova/core"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed files/GeoLite2-City.mmdb
var geoDBBytes []byte

func main() {
	core.InitGeo(geoDBBytes)

	app := NewApp()

	err := wails.Run(&options.App{
		Title:                    "ProxyNova",
		Width:                    1200,
		Height:                   760,
		MinWidth:                 900,
		MinHeight:                600,
		Frameless:                true,
		EnableDefaultContextMenu: false,
		BackgroundColour:         &options.RGBA{R: 13, G: 13, B: 13, A: 255},
		Windows: &windows.Options{
			WebviewIsTransparent: false,
			WindowIsTranslucent:  false,
			DisableWindowIcon:    false,
		},
		OnStartup:     app.startup,
		OnShutdown:    app.shutdown,
		OnBeforeClose: app.beforeClose,
		Bind:          []interface{}{app},
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
