import { useState, useMemo } from 'react'
import { useAppStore } from '../../store/appStore'
import ResultsTable from './ResultsTable'
import ResultsFilter from './ResultsFilter'
import ExportMenu from './ExportMenu'
import { IconTable } from '@tabler/icons-react'
import type { ResultFilter } from '../../types'

const defaultFilter: ResultFilter = {
  protocols: [],
  countries: [],
  anonymity: [],
  maxLatencyMs: 0,
  aliveOnly: false,
  search: '',
}

export default function ResultsPanel() {
  const { results, clearResults } = useAppStore()
  const [filter, setFilter] = useState<ResultFilter>(defaultFilter)

  const filtered = useMemo(() => {
    let r = results
    if (filter.aliveOnly) r = r.filter(x => x.alive)
    if (filter.protocols.length > 0) {
      const s = new Set(filter.protocols)
      r = r.filter(x => s.has(x.protocol))
    }
    if (filter.anonymity.length > 0) {
      const s = new Set(filter.anonymity)
      r = r.filter(x => s.has(x.anonymity))
    }
    if (filter.countries.length > 0) {
      const s = new Set(filter.countries)
      r = r.filter(x => s.has(x.geo?.countryCode))
    }
    if (filter.maxLatencyMs > 0) {
      r = r.filter(x => x.alive && x.latencyMs <= filter.maxLatencyMs)
    }
    if (filter.search) {
      const q = filter.search.toLowerCase()
      r = r.filter(x =>
        `${x.host}:${x.port} ${x.protocol} ${x.geo?.countryName} ${x.geo?.countryCode} ${x.geo?.isp}`.toLowerCase().includes(q)
      )
    }
    return r
  }, [results, filter])

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
        <IconTable size={36} className="text-[#333]" />
        <span className="text-sm text-[#555]">No results yet - load a proxy list and start checking.</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-start gap-3 px-4 py-3 border-b border-[#2a2a2a] shrink-0">
        <ResultsFilter filter={filter} results={results} onChange={setFilter} />
        <div className="ml-auto flex items-center gap-3 shrink-0">
          <span className="text-xs text-[#555] font-mono">
            {filtered.length.toLocaleString()} / {results.length.toLocaleString()}
          </span>
          <button
            onClick={clearResults}
            className="text-xs text-[#555] hover:text-red-400 transition-colors duration-150"
          >
            clear
          </button>
          <ExportMenu filter={filter} />
        </div>
      </div>
      <ResultsTable results={filtered} />
    </div>
  )
}
