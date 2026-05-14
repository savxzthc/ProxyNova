export interface Proxy {
  host: string
  port: number
  protocol: string
  username?: string
  password?: string
  raw: string
}

export interface GeoInfo {
  countryCode: string
  countryName: string
  city: string
  isp: string
  asn: string
}

export interface Result {
  host: string
  port: number
  protocol: string
  username?: string
  password?: string
  alive: boolean
  latencyMs: number
  anonymity: 'elite' | 'anonymous' | 'transparent' | ''
  geo: GeoInfo
  checkedAt: string
  error?: string
}

export interface CheckConfig {
  threads: number
  timeoutMs: number
  protocols: string[]
  judges: Judge[]
  shuffle: boolean
  retryCount: number
}

export interface CheckProgress {
  total: number
  checked: number
  alive: number
  dead: number
  perProtocol: Record<string, number>
  elapsedMs: number
  ratePerSec: number
}

export interface Judge {
  id: string
  url: string
  protocol: string
  active: boolean
  notes: string
}

export interface ScrapeSource {
  id: string
  name: string
  url: string
  active: boolean
  lastScraped: string
  lastCount: number
}

export interface ScrapeProgress {
  sourceId: string
  name: string
  count: number
  done: boolean
  error?: string
}

export interface AppSettings {
  defaultThreads: number
  defaultTimeout: number
  autoScrapeOnStart: boolean
  exportFormat: string
  txtFormat: string
  theme: string
  checkOnScrape: boolean
}

export interface ResultFilter {
  protocols: string[]
  countries: string[]
  anonymity: string[]
  aliveOnly: boolean
  search: string
}
