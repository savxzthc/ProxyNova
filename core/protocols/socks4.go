package protocols

import (
	"context"
	"encoding/binary"
	"fmt"
	"io"
	"net"
	"net/http"
	"strconv"
	"time"
)

func CheckSOCKS4(p ProxyInfo, judgeURL string, timeoutMs int, realIP string) CheckResult {
	dialer := &socks4Dialer{
		proxyAddr: fmt.Sprintf("%s:%d", p.Host, p.Port),
		userID:    p.Username,
		timeout:   time.Duration(timeoutMs) * time.Millisecond,
	}

	transport := &http.Transport{
		DialContext:           dialer.DialContext,
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

type socks4Dialer struct {
	proxyAddr string
	userID    string
	timeout   time.Duration
}

func (d *socks4Dialer) DialContext(ctx context.Context, network, addr string) (net.Conn, error) {
	if network != "tcp" && network != "tcp4" {
		return nil, fmt.Errorf("unsupported network for SOCKS4: %s", network)
	}

	targetHost, targetPortStr, err := net.SplitHostPort(addr)
	if err != nil {
		return nil, err
	}
	targetPort, err := strconv.Atoi(targetPortStr)
	if err != nil || targetPort < 1 || targetPort > 65535 {
		return nil, fmt.Errorf("invalid target port: %s", targetPortStr)
	}

	targetIP, err := resolveIPv4(ctx, targetHost)
	if err != nil {
		return nil, err
	}

	baseDialer := &net.Dialer{Timeout: d.timeout}
	conn, err := baseDialer.DialContext(ctx, "tcp", d.proxyAddr)
	if err != nil {
		return nil, err
	}

	if deadline, ok := ctx.Deadline(); ok {
		_ = conn.SetDeadline(deadline)
	} else if d.timeout > 0 {
		_ = conn.SetDeadline(time.Now().Add(d.timeout))
	}

	req := make([]byte, 0, 9+len(d.userID))
	req = append(req, 0x04, 0x01)
	portBytes := make([]byte, 2)
	binary.BigEndian.PutUint16(portBytes, uint16(targetPort))
	req = append(req, portBytes...)
	req = append(req, targetIP...)
	req = append(req, []byte(d.userID)...)
	req = append(req, 0x00)

	if _, err := conn.Write(req); err != nil {
		_ = conn.Close()
		return nil, err
	}

	resp := make([]byte, 8)
	if _, err := io.ReadFull(conn, resp); err != nil {
		_ = conn.Close()
		return nil, err
	}
	if resp[1] != 0x5A {
		_ = conn.Close()
		return nil, fmt.Errorf("SOCKS4 connect failed: status 0x%02x", resp[1])
	}

	_ = conn.SetDeadline(time.Time{})
	return conn, nil
}

func resolveIPv4(ctx context.Context, host string) ([]byte, error) {
	if ip := net.ParseIP(host); ip != nil {
		if ip4 := ip.To4(); ip4 != nil {
			return ip4, nil
		}
		return nil, fmt.Errorf("SOCKS4 target is not IPv4: %s", host)
	}

	addrs, err := net.DefaultResolver.LookupIPAddr(ctx, host)
	if err != nil {
		return nil, err
	}
	for _, addr := range addrs {
		if ip4 := addr.IP.To4(); ip4 != nil {
			return ip4, nil
		}
	}
	return nil, fmt.Errorf("no IPv4 address found for SOCKS4 target: %s", host)
}
