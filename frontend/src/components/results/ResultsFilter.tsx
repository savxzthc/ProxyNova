import { useEffect, useMemo, useRef, useState } from 'react'
import type { Result, ResultFilter } from '../../types'

interface Props {
  filter: ResultFilter
  results: Result[]
  onChange: (f: ResultFilter) => void
}

const protoOpts = ['http', 'https', 'socks4', 'socks5']
const anonOpts = ['elite', 'anonymous', 'transparent']
const defaultFilter: ResultFilter = {
  protocols: [],
  countries: [],
  anonymity: [],
  maxLatencyMs: 0,
  aliveOnly: false,
  search: '',
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors duration-150 ${
        active
          ? 'bg-blue-950 text-blue-400 border-blue-800'
          : 'bg-[#1c1c1c] text-[#555] border-[#2a2a2a] hover:text-[#888]'
      }`}
    >
      {label}
    </button>
  )
}

export default function ResultsFilter({ filter, results, onChange }: Props) {
  const [countryOpen, setCountryOpen] = useState(false)
  const [countryQuery, setCountryQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setCountryOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  const countryOptions = useMemo(() => {
    const map = new Map<string, { code: string; name: string }>()
    for (const result of results) {
      const code = result.geo?.countryCode?.trim()
      if (!code) continue
      map.set(code, { code, name: result.geo?.countryName?.trim() || code })
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [results])

  const visibleCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase()
    if (!q) return countryOptions
    return countryOptions.filter(c =>
      c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    )
  }, [countryOptions, countryQuery])

  const toggleArray = (key: 'protocols' | 'anonymity' | 'countries', val: string) => {
    const arr = filter[key]
    onChange({
      ...filter,
      [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val],
    })
  }

  const setLatency = (value: number) => {
    onChange({ ...filter, maxLatencyMs: value })
  }

  const hasActiveFilter =
    filter.aliveOnly ||
    filter.search.trim() !== '' ||
    filter.maxLatencyMs > 0 ||
    filter.protocols.length > 0 ||
    filter.countries.length > 0 ||
    filter.anonymity.length > 0

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        type="text"
        placeholder="Search"
        value={filter.search}
        onChange={(e) => onChange({ ...filter, search: e.target.value })}
        className="bg-[#1c1c1c] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-xs text-[#e8e8e8] placeholder-[#555] focus:outline-none focus:border-blue-800 w-40 transition-colors duration-150"
      />

      <div className="flex gap-1">
        {protoOpts.map(p => (
          <Chip key={p} label={p.toUpperCase()} active={filter.protocols.includes(p)} onClick={() => toggleArray('protocols', p)} />
        ))}
      </div>

      <div className="flex gap-1">
        {anonOpts.map(a => (
          <Chip key={a} label={a.charAt(0).toUpperCase() + a.slice(1)} active={filter.anonymity.includes(a)} onClick={() => toggleArray('anonymity', a)} />
        ))}
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setCountryOpen(v => !v)}
          className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded border transition-colors duration-150 ${
            filter.countries.length > 0
              ? 'bg-blue-950 text-blue-400 border-blue-800'
              : 'bg-[#1c1c1c] text-[#555] border-[#2a2a2a] hover:text-[#888]'
          }`}
        >
          Countries
          {filter.countries.length > 0 && (
            <span className="rounded bg-blue-800/60 px-1 font-mono text-blue-100">{filter.countries.length}</span>
          )}
        </button>
        {countryOpen && (
          <div className="absolute left-0 top-full z-30 mt-1 w-64 rounded-lg border border-[#2a2a2a] bg-[#111] shadow-xl">
            <div className="p-2 border-b border-[#2a2a2a]">
              <input
                autoFocus
                type="text"
                value={countryQuery}
                onChange={e => setCountryQuery(e.target.value)}
                placeholder="Search countries"
                className="w-full bg-[#1c1c1c] border border-[#2a2a2a] rounded px-2 py-1.5 text-xs text-[#e8e8e8] placeholder-[#555] focus:outline-none focus:border-blue-800 transition-colors duration-150"
              />
            </div>
            <div className="max-h-52 overflow-y-auto p-1">
              {visibleCountries.length === 0 ? (
                <div className="px-2 py-4 text-center text-xs text-[#555]">No countries in results</div>
              ) : visibleCountries.map(country => {
                const active = filter.countries.includes(country.code)
                return (
                  <button
                    type="button"
                    key={country.code}
                    onClick={() => toggleArray('countries', country.code)}
                    className={`flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors duration-150 ${
                      active ? 'bg-blue-950/70 text-blue-300' : 'text-[#888] hover:bg-[#1c1c1c] hover:text-[#e8e8e8]'
                    }`}
                  >
                    <span className="truncate">{country.name}</span>
                    <span className="font-mono text-[10px] text-[#666]">{country.code}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        {[
          ['Any', 0],
          ['<500ms', 500],
          ['<1s', 1000],
          ['<2s', 2000],
        ].map(([label, value]) => (
          <Chip
            key={label}
            label={String(label)}
            active={filter.maxLatencyMs === value}
            onClick={() => setLatency(Number(value))}
          />
        ))}
        <button
          type="button"
          onClick={() => setLatency(filter.maxLatencyMs > 0 && ![500, 1000, 2000].includes(filter.maxLatencyMs) ? 0 : 3000)}
          className={`text-[10px] px-2 py-1 rounded border transition-colors duration-150 ${
            filter.maxLatencyMs > 0 && ![500, 1000, 2000].includes(filter.maxLatencyMs)
              ? 'bg-blue-950 text-blue-400 border-blue-800'
              : 'bg-[#1c1c1c] text-[#555] border-[#2a2a2a] hover:text-[#888]'
          }`}
        >
          Custom
        </button>
        {filter.maxLatencyMs > 0 && ![500, 1000, 2000].includes(filter.maxLatencyMs) && (
          <input
            type="number"
            min={1}
            value={filter.maxLatencyMs}
            onChange={e => onChange({ ...filter, maxLatencyMs: Math.max(0, Number(e.target.value) || 0) })}
            className="w-20 bg-[#1c1c1c] border border-[#2a2a2a] rounded px-2 py-1 text-xs font-mono text-[#e8e8e8] focus:outline-none focus:border-blue-800 transition-colors duration-150"
            aria-label="Custom max latency in milliseconds"
          />
        )}
      </div>

      <button
        type="button"
        onClick={() => onChange({ ...filter, aliveOnly: !filter.aliveOnly })}
        className={`text-[10px] px-2 py-1 rounded border transition-colors duration-150 ${
          filter.aliveOnly
            ? 'bg-green-950 text-green-400 border-green-800'
            : 'bg-[#1c1c1c] text-[#555] border-[#2a2a2a] hover:text-[#888]'
        }`}
      >
        alive only
      </button>

      {hasActiveFilter && (
        <button
          type="button"
          onClick={() => onChange(defaultFilter)}
          className="text-[10px] text-[#555] hover:text-[#e8e8e8] transition-colors duration-150"
        >
          clear filters
        </button>
      )}
    </div>
  )
}
