import type { ScrapeSource, ScrapeProgress } from '../../types'

interface Props {
  sources: ScrapeSource[]
  statuses: Record<string, ScrapeProgress>
  onToggle: (id: string) => void
  isScraping: boolean
}

function relativeTime(iso: string) {
  if (!iso || iso === '0001-01-01T00:00:00Z') return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function SourceGrid({ sources, statuses, onToggle, isScraping }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {sources.map((src) => {
        const st = statuses[src.id]
        const isActive = isScraping && !st?.done
        const isDone = !!st?.done && !st?.error
        const isError = !!st?.error

        const borderCls = isActive
          ? 'pulse-border border-blue-800'
          : isDone
          ? 'border-green-800'
          : isError
          ? 'border-red-800'
          : src.active
          ? 'border-[#2a2a2a]'
          : 'border-[#1c1c1c] opacity-50'

        const dotCls = isActive
          ? 'bg-blue-400 animate-pulse'
          : isDone
          ? 'bg-green-400'
          : isError
          ? 'bg-red-400'
          : src.active
          ? 'bg-[#333]'
          : 'bg-[#222]'

        return (
          <div
            key={src.id}
            className={`rounded-lg border p-3 bg-surface transition-all ${borderCls}`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotCls}`} />
                <span className="text-xs text-[#e8e8e8] truncate">{src.name}</span>
              </div>
              <button
                onClick={() => onToggle(src.id)}
                className={`w-7 h-4 rounded-full shrink-0 transition-colors ${
                  src.active ? 'bg-blue-600' : 'bg-[#333]'
                }`}
              >
                <span
                  className={`block w-3 h-3 rounded-full bg-white shadow transition-transform ${
                    src.active ? 'translate-x-3.5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <div className="space-y-0.5 text-[10px] text-[#555]">
              <div>
                Last scraped: <span className="text-[#888]">{relativeTime(src.lastScraped)}</span>
              </div>
              <div>
                Count:{' '}
                <span className="font-mono text-[#888]">
                  {st?.count != null
                    ? st.count.toLocaleString()
                    : src.lastCount > 0
                    ? src.lastCount.toLocaleString()
                    : '—'}
                </span>
              </div>
              {isError && (
                <div className="text-red-400 truncate" title={st.error}>{st.error}</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
