package core

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"sync"
	"time"
)

type ScrapeSource struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	URL         string    `json:"url"`
	Active      bool      `json:"active"`
	LastScraped time.Time `json:"lastScraped"`
	LastCount   int       `json:"lastCount"`
}

type ScrapeProgress struct {
	SourceID string `json:"sourceId"`
	Name     string `json:"name"`
	Count    int    `json:"count"`
	Done     bool   `json:"done"`
	Error    string `json:"error"`
}

type Scraper struct {
	mu      sync.Mutex
	running bool
	stopCh  chan struct{}
}

func NewScraper() *Scraper {
	return &Scraper{}
}

func DefaultSources() []ScrapeSource {
	sources := []struct {
		id, name, url string
	}{
		{"speedx-http", "TheSpeedX / HTTP", "https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt"},
		{"speedx-socks4", "TheSpeedX / SOCKS4", "https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/socks4.txt"},
		{"speedx-socks5", "TheSpeedX / SOCKS5", "https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/socks5.txt"},
		{"shifty-http", "ShiftyTR / HTTP", "https://raw.githubusercontent.com/ShiftyTR/Proxy-List/master/http.txt"},
		{"shifty-socks4", "ShiftyTR / SOCKS4", "https://raw.githubusercontent.com/ShiftyTR/Proxy-List/master/socks4.txt"},
		{"shifty-socks5", "ShiftyTR / SOCKS5", "https://raw.githubusercontent.com/ShiftyTR/Proxy-List/master/socks5.txt"},
		{"monosans-http", "monosans / HTTP", "https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt"},
		{"monosans-socks4", "monosans / SOCKS4", "https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/socks4.txt"},
		{"monosans-socks5", "monosans / SOCKS5", "https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/socks5.txt"},
		{"hookzof-socks5", "hookzof / SOCKS5", "https://raw.githubusercontent.com/hookzof/socks5_list/master/proxy.txt"},
		{"clarketm", "clarketm / mixed", "https://raw.githubusercontent.com/clarketm/proxy-list/master/proxy-list-raw.txt"},
		{"sunny9577", "sunny9577 / mixed", "https://raw.githubusercontent.com/sunny9577/proxy-scraper/master/proxies.txt"},
		{"proxylist-http", "proxy-list.download / HTTP", "https://www.proxy-list.download/api/v1/get?type=http"},
		{"proxylist-socks4", "proxy-list.download / SOCKS4", "https://www.proxy-list.download/api/v1/get?type=socks4"},
		{"proxylist-socks5", "proxy-list.download / SOCKS5", "https://www.proxy-list.download/api/v1/get?type=socks5"},
		{"proxyscrape-http", "proxyscrape / HTTP", "https://api.proxyscrape.com/v2/?request=getproxies&protocol=http"},
		{"proxyscrape-socks4", "proxyscrape / SOCKS4", "https://api.proxyscrape.com/v2/?request=getproxies&protocol=socks4"},
		{"proxyscrape-socks5", "proxyscrape / SOCKS5", "https://api.proxyscrape.com/v2/?request=getproxies&protocol=socks5"},
		{"freeproxylists", "freeproxylists.net", "https://www.freeproxylists.net/"},
		{"free-proxy-list", "free-proxy-list.net", "https://free-proxy-list.net/"},
	}

	out := make([]ScrapeSource, len(sources))
	for i, s := range sources {
		out[i] = ScrapeSource{
			ID:     s.id,
			Name:   s.name,
			URL:    s.url,
			Active: true,
		}
	}
	return out
}

var proxyRegex = regexp.MustCompile(`\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d{2,5})\b`)

func (s *Scraper) Start(sources []ScrapeSource, onProgress func(ScrapeProgress), onDone func([]string)) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.running {
		return
	}
	s.running = true
	s.stopCh = make(chan struct{})

	go func() {
		defer func() {
			s.mu.Lock()
			s.running = false
			s.mu.Unlock()
		}()

		sem := make(chan struct{}, 10)
		var wg sync.WaitGroup
		var allMu sync.Mutex
		allProxies := make(map[string]bool)

		for _, src := range sources {
			if !src.Active {
				continue
			}
			select {
			case <-s.stopCh:
				goto done
			default:
			}

			wg.Add(1)
			src := src
			go func() {
				defer wg.Done()
				sem <- struct{}{}
				defer func() { <-sem }()

				select {
				case <-s.stopCh:
					return
				default:
				}

				proxies, err := fetchProxies(src.URL)
				prog := ScrapeProgress{
					SourceID: src.ID,
					Name:     src.Name,
					Count:    len(proxies),
					Done:     true,
				}
				if err != nil {
					prog.Error = err.Error()
				}

				allMu.Lock()
				for _, p := range proxies {
					allProxies[p] = true
				}
				allMu.Unlock()

				if onProgress != nil {
					onProgress(prog)
				}
			}()
		}

		wg.Wait()

	done:
		if onDone != nil {
			allMu.Lock()
			out := make([]string, 0, len(allProxies))
			for p := range allProxies {
				out = append(out, p)
			}
			allMu.Unlock()
			onDone(out)
		}
	}()
}

func (s *Scraper) Stop() {
	s.mu.Lock()
	defer s.mu.Unlock()
	if !s.running {
		return
	}
	select {
	case <-s.stopCh:
	default:
		close(s.stopCh)
	}
}

func (s *Scraper) IsRunning() bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.running
}

func ValidateSourceURL(rawURL string) error {
	u, err := url.Parse(rawURL)
	if err != nil {
		return fmt.Errorf("invalid URL: %w", err)
	}
	if u.Scheme != "http" && u.Scheme != "https" {
		return fmt.Errorf("only http/https URLs are allowed")
	}
	return nil
}

func fetchProxies(rawURL string) ([]string, error) {
	if err := ValidateSourceURL(rawURL); err != nil {
		return nil, err
	}
	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Get(rawURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("HTTP %d", resp.StatusCode)
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, 5*1024*1024))
	if err != nil {
		return nil, err
	}

	matches := proxyRegex.FindAllString(string(body), -1)
	seen := make(map[string]bool)
	var proxies []string
	for _, m := range matches {
		m = strings.TrimSpace(m)
		if !seen[m] {
			seen[m] = true
			proxies = append(proxies, m)
		}
	}
	return proxies, nil
}
