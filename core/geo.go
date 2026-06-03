package core

import (
	"net"
	"sync"

	"github.com/oschwald/geoip2-golang"
)

type GeoInfo struct {
	CountryCode string `json:"countryCode"`
	CountryName string `json:"countryName"`
	City        string `json:"city"`
	ISP         string `json:"isp"`
	ASN         string `json:"asn"`
}

var (
	geoMu     sync.RWMutex
	geoReader *geoip2.Reader
)

func InitGeo(data []byte) {
	geoMu.Lock()
	defer geoMu.Unlock()

	geoReader = nil
	if len(data) == 0 {
		return
	}

	reader, err := geoip2.FromBytes(data)
	if err != nil {
		return
	}
	geoReader = reader
}

func LookupIP(ipStr string) GeoInfo {
	geoMu.RLock()
	r := geoReader
	geoMu.RUnlock()
	if r == nil {
		return GeoInfo{}
	}

	ip := net.ParseIP(ipStr)
	if ip == nil {
		return GeoInfo{}
	}

	record, err := r.City(ip)
	if err != nil {
		return GeoInfo{}
	}

	city := ""
	if len(record.City.Names) > 0 {
		city = record.City.Names["en"]
	}

	return GeoInfo{
		CountryCode: record.Country.IsoCode,
		CountryName: record.Country.Names["en"],
		City:        city,
	}
}
