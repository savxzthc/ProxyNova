package core

import (
	"math/rand"
	"sync"
	"sync/atomic"
	"time"

	"proxynova/core/protocols"
)

type CheckConfig struct {
	Threads    int      `json:"threads"`
	TimeoutMs  int      `json:"timeoutMs"`
	Protocols  []string `json:"protocols"`
	Judges     []Judge  `json:"judges"`
	Shuffle    bool     `json:"shuffle"`
	RetryCount int      `json:"retryCount"`
}

type CheckProgress struct {
	Total       int                `json:"total"`
	Checked     int                `json:"checked"`
	Alive       int                `json:"alive"`
	Dead        int                `json:"dead"`
	PerProtocol map[string]int     `json:"perProtocol"`
	ElapsedMs   int64              `json:"elapsedMs"`
	RatePerSec  float64            `json:"ratePerSec"`
}

type Result struct {
	Host      string    `json:"host"`
	Port      int       `json:"port"`
	Protocol  string    `json:"protocol"`
	Username  string    `json:"username"`
	Password  string    `json:"password"`
	Alive     bool      `json:"alive"`
	LatencyMs int64     `json:"latencyMs"`
	Anonymity string    `json:"anonymity"`
	Geo       GeoInfo   `json:"geo"`
	CheckedAt time.Time `json:"checkedAt"`
	Error     string    `json:"error"`
}

type ResultFilter struct {
	Protocols []string `json:"protocols"`
	Countries []string `json:"countries"`
	Anonymity []string `json:"anonymity"`
	AliveOnly bool     `json:"aliveOnly"`
	Search    string   `json:"search"`
}

type AppSettings struct {
	DefaultThreads    int    `json:"defaultThreads"`
	DefaultTimeout    int    `json:"defaultTimeout"`
	AutoScrapeOnStart bool   `json:"autoScrapeOnStart"`
	ExportFormat      string `json:"exportFormat"`
	TXTFormat         string `json:"txtFormat"`
	Theme             string `json:"theme"`
	CheckOnScrape     bool   `json:"checkOnScrape"`
}

type CheckerCallbacks struct {
	OnProgress func(CheckProgress)
	OnResult   func(Result)
	OnComplete func(CheckProgress)
}

type Checker struct {
	mu       sync.Mutex
	running  bool
	stopCh   chan struct{}
	wg       sync.WaitGroup
	realIP   string

	total    int64
	checked  int64
	alive    int64
	dead     int64
	perProto sync.Map

	recentChecked []int64
	recentMu      sync.Mutex
}

func NewChecker(realIP string) *Checker {
	return &Checker{realIP: realIP}
}

func (c *Checker) Start(proxies []Proxy, cfg CheckConfig, cbs CheckerCallbacks) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.running {
		return
	}
	c.running = true
	c.stopCh = make(chan struct{})

	atomic.StoreInt64(&c.total, int64(len(proxies)))
	atomic.StoreInt64(&c.checked, 0)
	atomic.StoreInt64(&c.alive, 0)
	atomic.StoreInt64(&c.dead, 0)
	c.perProto = sync.Map{}

	if cfg.Shuffle {
		rand.Shuffle(len(proxies), func(i, j int) { proxies[i], proxies[j] = proxies[j], proxies[i] })
	}

	threads := cfg.Threads
	if threads < 1 {
		threads = 100
	}

	work := make(chan Proxy, threads*2)
	startTime := time.Now()

	go func() {
		for _, p := range proxies {
			select {
			case <-c.stopCh:
				close(work)
				return
			case work <- p:
			}
		}
		close(work)
	}()

	for i := 0; i < threads; i++ {
		c.wg.Add(1)
		go func() {
			defer c.wg.Done()
			for p := range work {
				select {
				case <-c.stopCh:
					return
				default:
				}
				result := c.checkProxy(p, cfg)
				atomic.AddInt64(&c.checked, 1)
				if result.Alive {
					atomic.AddInt64(&c.alive, 1)
					c.perProto.Store(result.Protocol, c.protoCount(result.Protocol)+1)
				} else {
					atomic.AddInt64(&c.dead, 1)
				}

				now := time.Now().UnixMilli()
				c.recentMu.Lock()
				c.recentChecked = append(c.recentChecked, now)
				cutoff := now - 2000
				start := 0
				for start < len(c.recentChecked) && c.recentChecked[start] < cutoff {
					start++
				}
				c.recentChecked = c.recentChecked[start:]
				c.recentMu.Unlock()

				if cbs.OnResult != nil {
					cbs.OnResult(result)
				}
			}
		}()
	}

	go func() {
		ticker := time.NewTicker(100 * time.Millisecond)
		defer ticker.Stop()
		for {
			select {
			case <-c.stopCh:
				c.wg.Wait()
				prog := c.buildProgress(startTime)
				if cbs.OnComplete != nil {
					cbs.OnComplete(prog)
				}
				c.mu.Lock()
				c.running = false
				c.mu.Unlock()
				return
			case <-ticker.C:
				if cbs.OnProgress != nil {
					cbs.OnProgress(c.buildProgress(startTime))
				}
			}
		}
	}()

	go func() {
		c.wg.Wait()
		select {
		case <-c.stopCh:
		default:
			close(c.stopCh)
		}
	}()
}

func (c *Checker) Stop() {
	c.mu.Lock()
	defer c.mu.Unlock()
	if !c.running {
		return
	}
	select {
	case <-c.stopCh:
	default:
		close(c.stopCh)
	}
}

func (c *Checker) IsRunning() bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.running
}

func (c *Checker) buildProgress(startTime time.Time) CheckProgress {
	pp := make(map[string]int)
	c.perProto.Range(func(k, v interface{}) bool {
		pp[k.(string)] = v.(int)
		return true
	})

	c.recentMu.Lock()
	rate := float64(len(c.recentChecked)) / 2.0
	c.recentMu.Unlock()

	return CheckProgress{
		Total:       int(atomic.LoadInt64(&c.total)),
		Checked:     int(atomic.LoadInt64(&c.checked)),
		Alive:       int(atomic.LoadInt64(&c.alive)),
		Dead:        int(atomic.LoadInt64(&c.dead)),
		PerProtocol: pp,
		ElapsedMs:   time.Since(startTime).Milliseconds(),
		RatePerSec:  rate,
	}
}

func (c *Checker) protoCount(proto string) int {
	if v, ok := c.perProto.Load(proto); ok {
		return v.(int)
	}
	return 0
}

func (c *Checker) checkProxy(p Proxy, cfg CheckConfig) Result {
	protocolsToCheck := cfg.Protocols
	if len(protocolsToCheck) == 0 {
		if p.Protocol != "" {
			protocolsToCheck = []string{p.Protocol}
		} else {
			protocolsToCheck = []string{"http"}
		}
	}

	activeJudges := make([]Judge, 0, len(cfg.Judges))
	for _, j := range cfg.Judges {
		if j.Active {
			activeJudges = append(activeJudges, j)
		}
	}
	if len(activeJudges) == 0 {
		activeJudges = DefaultJudges()
	}

	bestResult := Result{
		Host:      p.Host,
		Port:      p.Port,
		Protocol:  p.Protocol,
		Username:  p.Username,
		Password:  p.Password,
		CheckedAt: time.Now(),
	}

	info := protocols.ProxyInfo{
		Host:     p.Host,
		Port:     p.Port,
		Protocol: p.Protocol,
		Username: p.Username,
		Password: p.Password,
	}

	for _, proto := range protocolsToCheck {
		info.Protocol = proto
		var judgeURL string
		for _, j := range activeJudges {
			if j.Protocol == "http" || j.Protocol == proto || (proto == "https" && j.Protocol == "https") {
				judgeURL = j.URL
				break
			}
		}
		if judgeURL == "" {
			judgeURL = activeJudges[0].URL
		}

		var cr protocols.CheckResult
		switch proto {
		case "http":
			cr = protocols.CheckHTTP(info, judgeURL, cfg.TimeoutMs, c.realIP)
		case "https":
			cr = protocols.CheckHTTPS(info, judgeURL, cfg.TimeoutMs, c.realIP)
		case "socks4":
			cr = protocols.CheckSOCKS4(info, judgeURL, cfg.TimeoutMs, c.realIP)
		case "socks5":
			cr = protocols.CheckSOCKS5(info, judgeURL, cfg.TimeoutMs, c.realIP)
		}

		if cr.Alive && (!bestResult.Alive || cr.LatencyMs < bestResult.LatencyMs) {
			bestResult.Alive = true
			bestResult.LatencyMs = cr.LatencyMs
			bestResult.Anonymity = cr.Anonymity
			bestResult.Protocol = proto
			bestResult.Error = ""
		} else if !bestResult.Alive && cr.Error != "" {
			bestResult.Error = cr.Error
		}
	}

	if bestResult.Alive {
		bestResult.Geo = LookupIP(p.Host)
	}

	return bestResult
}
