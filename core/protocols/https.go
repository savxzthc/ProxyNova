package protocols

import (
	"context"
	"crypto/tls"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"time"
)

func CheckHTTPS(p ProxyInfo, judgeURL string, timeoutMs int, realIP string) CheckResult {
	proxyAddr := fmt.Sprintf("http://%s:%d", p.Host, p.Port)
	proxyURL, err := url.Parse(proxyAddr)
	if err != nil {
		return CheckResult{Error: err.Error()}
	}

	if p.Username != "" {
		proxyURL.User = url.UserPassword(p.Username, p.Password)
	}

	transport := &http.Transport{
		Proxy: http.ProxyURL(proxyURL),
		DialContext: (&net.Dialer{
			Timeout: time.Duration(timeoutMs) * time.Millisecond,
		}).DialContext,
		TLSClientConfig:       &tls.Config{InsecureSkipVerify: true},
		TLSHandshakeTimeout:   time.Duration(timeoutMs) * time.Millisecond,
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
