package core

import (
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type Judge struct {
	ID       string `json:"id"`
	URL      string `json:"url"`
	Protocol string `json:"protocol"`
	Active   bool   `json:"active"`
	Notes    string `json:"notes"`
}

func DefaultJudges() []Judge {
	return []Judge{
		{ID: "j1", URL: "http://httpbin.org/get", Protocol: "http", Active: true, Notes: "Returns request headers as JSON"},
		{ID: "j2", URL: "https://httpbin.org/get", Protocol: "https", Active: true, Notes: "HTTPS version of httpbin"},
		{ID: "j3", URL: "http://azenv.net/", Protocol: "http", Active: true, Notes: "Returns all headers"},
		{ID: "j4", URL: "https://api64.ipify.org/", Protocol: "https", Active: true, Notes: "Returns client IP as plain text"},
	}
}

func GradeAnonymity(respHeaders http.Header, realIP string) string {
	leakHeaders := []string{
		"X-Forwarded-For",
		"X-Real-Ip",
		"Via",
		"Forwarded",
		"X-Client-Ip",
		"X-Proxy-Id",
		"X-Originating-Ip",
		"X-Remote-Ip",
		"X-Remote-Addr",
	}

	hasProxyHeaders := false
	leaksRealIP := false

	for _, h := range leakHeaders {
		val := respHeaders.Get(h)
		if val == "" {
			continue
		}
		hasProxyHeaders = true
		if realIP != "" && strings.Contains(val, realIP) {
			leaksRealIP = true
		}
	}

	if leaksRealIP {
		return "transparent"
	}
	if hasProxyHeaders {
		return "anonymous"
	}
	return "elite"
}

func ValidateJudgeURL(judgeURL string) error {
	u, err := url.Parse(judgeURL)
	if err != nil {
		return fmt.Errorf("invalid URL: %w", err)
	}
	if u.Scheme != "http" && u.Scheme != "https" {
		return fmt.Errorf("only http/https URLs are allowed")
	}
	return nil
}

func TestJudge(judgeURL string, timeoutMs int) (alive bool, latencyMs int64) {
	if err := ValidateJudgeURL(judgeURL); err != nil {
		return false, 0
	}
	client := &http.Client{
		Timeout: time.Duration(timeoutMs) * time.Millisecond,
	}
	start := time.Now()
	resp, err := client.Get(judgeURL)
	if err != nil {
		return false, 0
	}
	defer resp.Body.Close()
	latencyMs = time.Since(start).Milliseconds()
	return resp.StatusCode < 500, latencyMs
}
