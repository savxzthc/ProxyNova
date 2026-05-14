package protocols

import (
	"context"
	"fmt"
	"io"
	"net"
	"net/http"
	"time"

	"golang.org/x/net/proxy"
)

func CheckSOCKS5(p ProxyInfo, judgeURL string, timeoutMs int, realIP string) CheckResult {
	var auth *proxy.Auth
	if p.Username != "" {
		auth = &proxy.Auth{User: p.Username, Password: p.Password}
	}

	dialer, err := proxy.SOCKS5("tcp", fmt.Sprintf("%s:%d", p.Host, p.Port), auth, proxy.Direct)
	if err != nil {
		return CheckResult{Error: err.Error()}
	}

	transport := &http.Transport{
		DialContext: func(ctx context.Context, network, addr string) (net.Conn, error) {
			return dialer.Dial(network, addr)
		},
		ResponseHeaderTimeout: time.Duration(timeoutMs) * time.Millisecond,
	}

	client := &http.Client{
		Transport: transport,
		Timeout:   time.Duration(timeoutMs) * time.Millisecond,
	}

	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(timeoutMs)*time.Millisecond)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, "GET", judgeURL, nil)
	if err != nil {
		return CheckResult{Error: err.Error()}
	}

	start := time.Now()
	resp, err := client.Do(req)
	if err != nil {
		return CheckResult{Error: err.Error()}
	}
	defer resp.Body.Close()

	latency := time.Since(start).Milliseconds()
	body, _ := io.ReadAll(io.LimitReader(resp.Body, 8192))
	anonymity := gradeFromResponse(resp.Header, body, realIP)

	return CheckResult{
		Alive:     true,
		LatencyMs: latency,
		Anonymity: anonymity,
	}
}
