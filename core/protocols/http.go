package protocols

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type CheckResult struct {
	Alive     bool
	LatencyMs int64
	Anonymity string
	Error     string
}

type ProxyInfo struct {
	Host     string
	Port     int
	Protocol string
	Username string
	Password string
}

func CheckHTTP(p ProxyInfo, judgeURL string, timeoutMs int, realIP string) CheckResult {
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

func gradeFromResponse(headers http.Header, body []byte, realIP string) string {
	leakHeaders := []string{
		"X-Forwarded-For", "X-Real-Ip", "Via", "Forwarded",
		"X-Client-Ip", "X-Proxy-Id", "X-Originating-Ip",
	}

	hasProxy := false
	leaksReal := false

	for _, h := range leakHeaders {
		val := headers.Get(h)
		if val == "" {
			continue
		}
		hasProxy = true
		if realIP != "" && strings.Contains(val, realIP) {
			leaksReal = true
		}
	}

	if !hasProxy {
		var jsonBody map[string]interface{}
		if err := json.Unmarshal(body, &jsonBody); err == nil {
			if hdrs, ok := jsonBody["headers"].(map[string]interface{}); ok {
				for _, lh := range leakHeaders {
					if val, ok := hdrs[lh].(string); ok && val != "" {
						hasProxy = true
						if realIP != "" && strings.Contains(val, realIP) {
							leaksReal = true
						}
					}
				}
			}
		}
	}

	if leaksReal {
		return "transparent"
	}
	if hasProxy {
		return "anonymous"
	}
	return "elite"
}
