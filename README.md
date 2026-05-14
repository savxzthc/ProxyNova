# ProxyNova

A fast, offline-capable proxy checker and scraper desktop application.

## Features

- **Multi-protocol** — HTTP, HTTPS, SOCKS4, SOCKS5 checked in parallel
- **Anonymity grading** — Elite / Anonymous / Transparent via judge response analysis
- **Built-in scraper** — 20 public proxy list sources, concurrent, auto-dedup
- **Offline geo lookup** — Country/city resolution via embedded MaxMind GeoLite2
- **Virtualized results table** — Handles 100k+ rows without lag (`@tanstack/react-virtual`)
- **Persistent config** — Settings, judges, sources stored in embedded bbolt DB
- **Export** — TXT / CSV / JSON respecting current filter state
- **Dark frameless UI** — Custom titlebar, JetBrains Mono for data columns

## Download

Check the [Releases](../../releases) page for pre-built Windows binaries.

## Build from source

### Requirements

- [Go 1.22+](https://go.dev/dl/)
- [Node.js 18+](https://nodejs.org/)
- [Wails v2](https://wails.io/docs/gettingstarted/installation): `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
- `GeoLite2-City.mmdb` at `files/GeoLite2-City.mmdb` (see below)

```bash
git clone <repo>
cd proxynova
wails build
```

Output: `build/bin/ProxyNova.exe`

Dev mode with hot reload:

```bash
wails dev
```

## GeoLite2 setup

Offline geo lookup requires the MaxMind GeoLite2-City database (free after registration):

1. Register at [maxmind.com/en/geolite2/signup](https://www.maxmind.com/en/geolite2/signup)
2. Download `GeoLite2-City.mmdb`
3. Place it at `files/GeoLite2-City.mmdb` before building

The file is embedded into the binary at compile time. Missing file = build fails (intentional).

## License

MIT

You can configure the project by editing `wails.json`. More information about the project settings can be found
here: https://wails.io/docs/reference/project-config

## Live Development

To run in live development mode, run `wails dev` in the project directory. This will run a Vite development
server that will provide very fast hot reload of your frontend changes. If you want to develop in a browser
and have access to your Go methods, there is also a dev server that runs on http://localhost:34115. Connect
to this in your browser, and you can call your Go code from devtools.

## Building

To build a redistributable, production mode package, use `wails build`.
