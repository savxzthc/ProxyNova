package main

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"proxynova/core"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx     context.Context
	store   *core.Store
	checker *core.Checker
	scraper *core.Scraper
	results []core.Result
	mu      sync.RWMutex
	realIP  string

	pathMu           sync.Mutex
	allowedReadFiles map[string]struct{}
	allowedSavePaths map[string]struct{}
}

func NewApp() *App {
	return &App{
		allowedReadFiles: make(map[string]struct{}),
		allowedSavePaths: make(map[string]struct{}),
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	dbPath, err := appDataPath("proxynova.db")
	if err != nil {
		dbPath = "proxynova.db"
	}
	store, err := core.NewStore(dbPath)
	if err != nil {
		runtime.LogError(ctx, "Failed to open store: "+err.Error())
		return
	}
	a.store = store

	settings, _ := store.LoadSettings()

	a.realIP = a.fetchRealIP()
	a.checker = core.NewChecker(a.realIP)
	a.scraper = core.NewScraper()

	if settings.AutoScrapeOnStart {
		go func() { _ = a.StartScraping(nil) }()
	}
}

func (a *App) shutdown(ctx context.Context) {
	if a.store != nil {
		_ = a.store.Close()
	}
}

func (a *App) beforeClose(ctx context.Context) (prevent bool) {
	if a.checker != nil && a.checker.IsRunning() || a.scraper != nil && a.scraper.IsRunning() {
		choice, _ := runtime.MessageDialog(ctx, runtime.MessageDialogOptions{
			Type:          runtime.QuestionDialog,
			Title:         "Operation in progress",
			Message:       "A check or scrape is running. Close anyway?",
			DefaultButton: "No",
			Buttons:       []string{"Yes", "No"},
		})
		return choice != "Yes"
	}
	return false
}

func (a *App) fetchRealIP() string {
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get("https://api64.ipify.org/")
	if err != nil {
		return ""
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	return string(body)
}

func (a *App) StartChecking(proxyStrings []string, cfg core.CheckConfig) error {
	if a.checker == nil {
		return nil
	}
	if a.checker.IsRunning() {
		a.checker.Stop()
		a.checker.WaitForStop()
	}

	if a.realIP == "" {
		a.realIP = a.fetchRealIP()
		if a.realIP == "" {
			runtime.EventsEmit(a.ctx, "checker:warn", "Could not determine real IP — anonymity grading may be inaccurate")
		}
	}
	a.checker.SetRealIP(a.realIP)

	proxies := make([]core.Proxy, 0, len(proxyStrings))
	for _, s := range proxyStrings {
		p, err := core.ParseLine(s)
		if err != nil {
			continue
		}
		proxies = append(proxies, p)
	}

	if len(cfg.Protocols) == 0 {
		cfg.Protocols = []string{"http", "https", "socks4", "socks5"}
	}
	if cfg.TimeoutMs <= 0 {
		cfg.TimeoutMs = 5000
	}
	if cfg.Threads <= 0 {
		cfg.Threads = 200
	}
	if cfg.Threads > 2000 {
		cfg.Threads = 2000
	}
	if len(cfg.Judges) == 0 && a.store != nil {
		judges, _ := a.store.LoadJudges()
		cfg.Judges = judges
	}

	a.mu.Lock()
	a.results = nil
	a.mu.Unlock()

	a.checker.Start(proxies, cfg, core.CheckerCallbacks{
		OnProgress: func(p core.CheckProgress) {
			runtime.EventsEmit(a.ctx, "checker:progress", p)
		},
		OnResult: func(r core.Result) {
			a.mu.Lock()
			a.results = append(a.results, r)
			a.mu.Unlock()
			runtime.EventsEmit(a.ctx, "checker:result", r)
		},
		OnComplete: func(p core.CheckProgress) {
			runtime.EventsEmit(a.ctx, "checker:done", p)
		},
	})

	return nil
}

func (a *App) StopChecking() {
	if a.checker != nil {
		a.checker.Stop()
	}
}

func (a *App) GetCheckProgress() core.CheckProgress {
	return core.CheckProgress{}
}

func (a *App) StartScraping(sourceIDs []string) error {
	if a.store == nil {
		return nil
	}
	sources, _ := a.store.LoadSources()

	var active []core.ScrapeSource
	if len(sourceIDs) == 0 {
		for _, s := range sources {
			if s.Active {
				active = append(active, s)
			}
		}
	} else {
		idSet := make(map[string]bool)
		for _, id := range sourceIDs {
			idSet[id] = true
		}
		for _, s := range sources {
			if idSet[s.ID] {
				active = append(active, s)
			}
		}
	}

	a.scraper.Start(active,
		func(p core.ScrapeProgress) {
			runtime.EventsEmit(a.ctx, "scraper:progress", p)
		},
		func(proxies []string) {
			runtime.EventsEmit(a.ctx, "scraper:done", proxies)

			if a.store == nil {
				return
			}
			settings, _ := a.store.LoadSettings()
			if settings.CheckOnScrape && len(proxies) > 0 {
				judges, _ := a.store.LoadJudges()
				cfg := core.CheckConfig{
					Threads:   settings.DefaultThreads,
					TimeoutMs: settings.DefaultTimeout,
					Protocols: []string{"http", "https", "socks4", "socks5"},
					Judges:    judges,
				}
				_ = a.StartChecking(proxies, cfg)
			}
		},
	)

	return nil
}

func (a *App) StopScraping() {
	if a.scraper != nil {
		a.scraper.Stop()
	}
}

func (a *App) GetSources() []core.ScrapeSource {
	if a.store == nil {
		return core.DefaultSources()
	}
	sources, _ := a.store.LoadSources()
	return sources
}

func (a *App) SaveSources(sources []core.ScrapeSource) error {
	if a.store == nil {
		return nil
	}
	return a.store.SaveSources(sources)
}

func (a *App) GetResults(filter core.ResultFilter) []core.Result {
	a.mu.RLock()
	results := make([]core.Result, len(a.results))
	copy(results, a.results)
	a.mu.RUnlock()
	return core.FilterResults(results, filter)
}

func (a *App) ClearResults() {
	a.mu.Lock()
	a.results = nil
	a.mu.Unlock()
}

func (a *App) ExportResults(format string, filter core.ResultFilter, outputPath string) error {
	if err := a.validateSelectedSavePath(outputPath); err != nil {
		return err
	}
	clean, err := normalizePath(outputPath)
	if err != nil {
		return err
	}

	a.mu.RLock()
	results := make([]core.Result, len(a.results))
	copy(results, a.results)
	a.mu.RUnlock()

	filtered := core.FilterResults(results, filter)

	txtFormat := "host:port"
	if a.store != nil {
		settings, _ := a.store.LoadSettings()
		txtFormat = settings.TXTFormat
	}

	exportFilter := core.ExportFilter{
		Protocols: filter.Protocols,
		Countries: filter.Countries,
		Anonymity: filter.Anonymity,
		AliveOnly: filter.AliveOnly,
	}

	return core.Export(filtered, core.ExportFormat(format), exportFilter, clean, txtFormat)
}

func (a *App) GetJudges() []core.Judge {
	if a.store == nil {
		return core.DefaultJudges()
	}
	judges, _ := a.store.LoadJudges()
	return judges
}

func (a *App) SaveJudges(judges []core.Judge) error {
	if a.store == nil {
		return nil
	}
	return a.store.SaveJudges(judges)
}

func (a *App) TestJudge(url string) map[string]interface{} {
	alive, latency := core.TestJudge(url, 5000)
	return map[string]interface{}{"alive": alive, "latencyMs": latency}
}

func (a *App) GetSettings() core.AppSettings {
	if a.store == nil {
		return core.AppSettings{DefaultThreads: 200, DefaultTimeout: 5000, ExportFormat: "txt", TXTFormat: "host:port", Theme: "dark"}
	}
	settings, _ := a.store.LoadSettings()
	return settings
}

func (a *App) SaveSettings(settings core.AppSettings) error {
	if a.store == nil {
		return nil
	}
	return a.store.SaveSettings(settings)
}

func (a *App) GetIP() string {
	return a.realIP
}

func (a *App) ExportProxyList(proxies []string, outputPath string) error {
	if err := a.validateSelectedSavePath(outputPath); err != nil {
		return err
	}

	clean, err := normalizePath(outputPath)
	if err != nil {
		return err
	}

	f, err := os.Create(clean)
	if err != nil {
		return err
	}
	defer f.Close()
	for _, p := range proxies {
		if _, err := fmt.Fprintln(f, p); err != nil {
			return err
		}
	}
	return nil
}

func (a *App) OpenFileDialog() string {
	path, _ := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Open proxy list",
		Filters: []runtime.FileFilter{
			{DisplayName: "Text files", Pattern: "*.txt"},
			{DisplayName: "All files", Pattern: "*"},
		},
	})
	if path != "" {
		a.rememberReadPath(path)
	}
	return path
}

func (a *App) OpenSaveDialog(filename string) string {
	path, _ := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Export proxies",
		DefaultFilename: filename,
		Filters: []runtime.FileFilter{
			{DisplayName: "Text files", Pattern: "*.txt"},
			{DisplayName: "CSV files", Pattern: "*.csv"},
			{DisplayName: "JSON files", Pattern: "*.json"},
		},
	})
	if path != "" {
		a.rememberSavePath(path)
	}
	return path
}

func (a *App) ReadFile(path string) (string, error) {
	if err := a.validateSelectedReadPath(path); err != nil {
		return "", err
	}

	clean, err := normalizePath(path)
	if err != nil {
		return "", err
	}
	data, err := os.ReadFile(clean)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func appDataPath(filename string) (string, error) {
	dir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	appDir := filepath.Join(dir, "ProxyNova")
	if err := os.MkdirAll(appDir, 0700); err != nil {
		return "", err
	}
	return filepath.Join(appDir, filename), nil
}

func (a *App) rememberReadPath(path string) {
	clean, err := normalizePath(path)
	if err != nil {
		return
	}
	a.pathMu.Lock()
	a.allowedReadFiles[pathKey(clean)] = struct{}{}
	a.pathMu.Unlock()
}

func (a *App) rememberSavePath(path string) {
	clean, err := normalizePath(path)
	if err != nil {
		return
	}
	a.pathMu.Lock()
	a.allowedSavePaths[pathKey(clean)] = struct{}{}
	a.pathMu.Unlock()
}

func (a *App) validateSelectedReadPath(path string) error {
	clean, err := normalizePath(path)
	if err != nil {
		return err
	}
	a.pathMu.Lock()
	_, ok := a.allowedReadFiles[pathKey(clean)]
	a.pathMu.Unlock()
	if !ok {
		return errors.New("file must be selected through OpenFileDialog")
	}
	return nil
}

func (a *App) validateSelectedSavePath(path string) error {
	clean, err := normalizePath(path)
	if err != nil {
		return err
	}
	ext := strings.ToLower(filepath.Ext(clean))
	if ext != ".txt" && ext != ".csv" && ext != ".json" {
		return errors.New("export path must end in .txt, .csv, or .json")
	}
	a.pathMu.Lock()
	_, ok := a.allowedSavePaths[pathKey(clean)]
	a.pathMu.Unlock()
	if !ok {
		return errors.New("export path must be selected through OpenSaveDialog")
	}
	return nil
}

func normalizePath(path string) (string, error) {
	if strings.TrimSpace(path) == "" {
		return "", errors.New("path is empty")
	}
	return filepath.Abs(filepath.Clean(path))
}

func pathKey(path string) string {
	if os.PathSeparator == '\\' {
		return strings.ToLower(path)
	}
	return path
}
