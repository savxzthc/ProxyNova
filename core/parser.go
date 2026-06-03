package core

import (
	"fmt"
	"net"
	"strconv"
	"strings"
)

type Proxy struct {
	Host     string
	Port     int
	Protocol string
	Username string
	Password string
	Raw      string
}

func ParseList(input string) []Proxy {
	lines := strings.Split(input, "\n")
	seen := make(map[string]bool)
	var proxies []Proxy
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		p, err := ParseLine(line)
		if err != nil {
			continue
		}
		key := fmt.Sprintf("%s:%d:%s", p.Host, p.Port, p.Protocol)
		if seen[key] {
			continue
		}
		seen[key] = true
		proxies = append(proxies, p)
	}
	return proxies
}

func ParseLine(line string) (Proxy, error) {
	line = strings.TrimSpace(line)
	if line == "" {
		return Proxy{}, fmt.Errorf("empty line")
	}

	var p Proxy
	p.Raw = line

	if strings.Contains(line, "://") {
		return parseWithScheme(line)
	}

	parts := strings.Split(line, ":")
	switch len(parts) {
	case 2:
		return parseHostPort(parts[0], parts[1], "http")
	case 4:
		host := parts[0]
		portStr := parts[1]
		user := parts[2]
		pass := parts[3]
		p, err := parseHostPort(host, portStr, "http")
		if err != nil {
			return Proxy{}, err
		}
		p.Username = user
		p.Password = pass
		return p, nil
	default:
		return Proxy{}, fmt.Errorf("unrecognized format: %s", line)
	}
}

func parseWithScheme(line string) (Proxy, error) {
	schemeEnd := strings.Index(line, "://")
	scheme := strings.ToLower(line[:schemeEnd])
	rest := line[schemeEnd+3:]

	if scheme != "http" && scheme != "https" && scheme != "socks4" && scheme != "socks5" {
		return Proxy{}, fmt.Errorf("unknown protocol: %s", scheme)
	}

	var user, pass, hostport string

	if atIdx := strings.LastIndex(rest, "@"); atIdx != -1 {
		creds := rest[:atIdx]
		hostport = rest[atIdx+1:]
		if colonIdx := strings.Index(creds, ":"); colonIdx != -1 {
			user = creds[:colonIdx]
			pass = creds[colonIdx+1:]
		} else {
			user = creds
		}
	} else {
		hostport = rest
	}

	hostStr, portStr, err := net.SplitHostPort(hostport)
	if err != nil {
		return Proxy{}, fmt.Errorf("invalid host:port %q: %w", hostport, err)
	}
	port, err := strconv.Atoi(portStr)
	if err != nil || port < 1 || port > 65535 {
		return Proxy{}, fmt.Errorf("invalid port: %s", portStr)
	}

	return Proxy{
		Host:     hostStr,
		Port:     port,
		Protocol: scheme,
		Username: user,
		Password: pass,
		Raw:      line,
	}, nil
}

func parseHostPort(host, portStr, protocol string) (Proxy, error) {
	port, err := strconv.Atoi(strings.TrimSpace(portStr))
	if err != nil || port < 1 || port > 65535 {
		return Proxy{}, fmt.Errorf("invalid port: %s", portStr)
	}
	host = strings.TrimSpace(host)
	if host == "" {
		return Proxy{}, fmt.Errorf("invalid host: %s", host)
	}
	return Proxy{
		Host:     host,
		Port:     port,
		Protocol: protocol,
		Raw:      fmt.Sprintf("%s:%d", host, port),
	}, nil
}

func Deduplicate(proxies []Proxy) []Proxy {
	seen := make(map[string]bool)
	var out []Proxy
	for _, p := range proxies {
		key := fmt.Sprintf("%s:%d:%s", p.Host, p.Port, p.Protocol)
		if !seen[key] {
			seen[key] = true
			out = append(out, p)
		}
	}
	return out
}
