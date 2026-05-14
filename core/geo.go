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
	geoReader  *geoip2.Reader
	geoOnce    sync.Once
	geoDBBytes []byte
)

func InitGeo(data []byte) {
	geoDBBytes = data
}

func getReader() *geoip2.Reader {
	geoOnce.Do(func() {
		if len(geoDBBytes) == 0 {
			return
		}
		geoReader, _ = geoip2.FromBytes(geoDBBytes)
	})
	return geoReader
}

func LookupIP(ipStr string) GeoInfo {
	r := getReader()
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
