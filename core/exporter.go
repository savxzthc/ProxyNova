package core

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"
)

type ExportFormat string

const (
	FormatTXT  ExportFormat = "txt"
	FormatCSV  ExportFormat = "csv"
	FormatJSON ExportFormat = "json"
)

type ExportFilter struct {
	Protocols []string `json:"protocols"`
	Countries []string `json:"countries"`
	Anonymity []string `json:"anonymity"`
	AliveOnly bool     `json:"aliveOnly"`
}

func Export(results []Result, format ExportFormat, filter ExportFilter, outputPath string, txtFormat string) error {
	filtered := applyFilter(results, filter)

	f, err := os.Create(outputPath)
	if err != nil {
		return err
	}
	defer f.Close()

	switch format {
	case FormatTXT:
		return exportTXT(filtered, f, txtFormat)
	case FormatCSV:
		return exportCSV(filtered, f)
	case FormatJSON:
		return exportJSON(filtered, f)
	default:
		return fmt.Errorf("unknown format: %s", format)
	}
}

func applyFilter(results []Result, f ExportFilter) []Result {
	var out []Result
	protoSet := toSet(f.Protocols)
	countrySet := toSet(f.Countries)
	anonSet := toSet(f.Anonymity)

	for _, r := range results {
		if f.AliveOnly && !r.Alive {
			continue
		}
		if len(protoSet) > 0 && !protoSet[r.Protocol] {
			continue
		}
		if len(countrySet) > 0 && !countrySet[r.Geo.CountryCode] {
			continue
		}
		if len(anonSet) > 0 && !anonSet[r.Anonymity] {
			continue
		}
		out = append(out, r)
	}
	return out
}

func toSet(s []string) map[string]bool {
	m := make(map[string]bool)
	for _, v := range s {
		m[v] = true
	}
	return m
}

func exportTXT(results []Result, f *os.File, txtFormat string) error {
	for _, r := range results {
		var line string
		switch txtFormat {
		case "protocol://host:port":
			line = fmt.Sprintf("%s://%s:%d", r.Protocol, r.Host, r.Port)
		case "host:port:user:pass":
			line = fmt.Sprintf("%s:%d:%s:%s", r.Host, r.Port, r.Username, r.Password)
		default:
			line = fmt.Sprintf("%s:%d", r.Host, r.Port)
		}
		if _, err := fmt.Fprintln(f, line); err != nil {
			return err
		}
	}
	return nil
}

func exportCSV(results []Result, f *os.File) error {
	w := csv.NewWriter(f)
	defer w.Flush()

	header := []string{"host", "port", "protocol", "username", "password", "alive", "latency_ms", "anonymity", "country_code", "country_name", "city", "isp", "checked_at", "error"}
	if err := w.Write(header); err != nil {
		return err
	}

	for _, r := range results {
		alive := "false"
		if r.Alive {
			alive = "true"
		}
		row := []string{
			r.Host,
			fmt.Sprintf("%d", r.Port),
			r.Protocol,
			r.Username,
			r.Password,
			alive,
			fmt.Sprintf("%d", r.LatencyMs),
			r.Anonymity,
			r.Geo.CountryCode,
			r.Geo.CountryName,
			r.Geo.City,
			r.Geo.ISP,
			r.CheckedAt.Format(time.RFC3339),
			r.Error,
		}
		if err := w.Write(row); err != nil {
			return err
		}
	}
	return nil
}

func exportJSON(results []Result, f *os.File) error {
	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	return enc.Encode(results)
}

func FilterResults(results []Result, filter ResultFilter) []Result {
	if filter.AliveOnly == false && len(filter.Protocols) == 0 && len(filter.Countries) == 0 && len(filter.Anonymity) == 0 && filter.Search == "" {
		return results
	}

	protoSet := toSet(filter.Protocols)
	countrySet := toSet(filter.Countries)
	anonSet := toSet(filter.Anonymity)
	search := strings.ToLower(filter.Search)

	var out []Result
	for _, r := range results {
		if filter.AliveOnly && !r.Alive {
			continue
		}
		if len(protoSet) > 0 && !protoSet[r.Protocol] {
			continue
		}
		if len(countrySet) > 0 && !countrySet[r.Geo.CountryCode] {
			continue
		}
		if len(anonSet) > 0 && !anonSet[r.Anonymity] {
			continue
		}
		if search != "" {
			haystack := strings.ToLower(fmt.Sprintf("%s:%d %s %s %s", r.Host, r.Port, r.Protocol, r.Geo.CountryName, r.Geo.ISP))
			if !strings.Contains(haystack, search) {
				continue
			}
		}
		out = append(out, r)
	}
	return out
}
