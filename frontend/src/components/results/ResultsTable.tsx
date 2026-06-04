import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { IconTableOff } from '@tabler/icons-react'
import type { Result } from '../../types'

interface Props {
  results: Result[]
}

function ProtoBadge({ proto }: { proto: string }) {
  const cls =
    proto === 'http'   ? 'bg-blue-950 text-blue-400 border-blue-800' :
    proto === 'https'  ? 'bg-green-950 text-green-400 border-green-800' :
    proto === 'socks4' ? 'bg-purple-950 text-purple-400 border-purple-800' :
    proto === 'socks5' ? 'bg-amber-950 text-amber-400 border-amber-800' :
    'bg-[#1c1c1c] text-[#888] border-[#2a2a2a]'
  return (
    <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border ${cls}`}>
      {proto.toUpperCase()}
    </span>
  )
}

function AnonBadge({ anon }: { anon: string }) {
  const cls =
    anon === 'elite'       ? 'bg-green-950 text-green-300 border-green-800' :
    anon === 'anonymous'   ? 'bg-yellow-950 text-yellow-300 border-yellow-800' :
    anon === 'transparent' ? 'bg-red-950 text-red-300 border-red-800' :
    'bg-[#1c1c1c] text-[#555] border-[#2a2a2a]'
  const label =
    anon === 'elite' ? 'Elite' :
    anon === 'anonymous' ? 'Anon' :
    anon === 'transparent' ? 'Trans' : '-'
  return (
    <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border ${cls}`}>
      {label}
    </span>
  )
}

function LatencyCell({ ms }: { ms: number }) {
  const cls = ms < 500 ? 'text-green-400' : ms <= 2000 ? 'text-yellow-400' : 'text-red-400'
  return <span className={`font-mono text-xs ${cls}`}>{ms}ms</span>
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  return `${Math.floor(m / 60)}h ago`
}

const ROW_H = 34
const TABLE_MIN_WIDTH = 960
const columns = '16px minmax(150px, 1.25fr) 56px 78px 84px 62px minmax(88px, .75fr) minmax(110px, 1fr) 78px 72px'
const gridStyle = {
  gridTemplateColumns: columns,
  columnGap: 10,
  minWidth: TABLE_MIN_WIDTH,
}

export default function ResultsTable({ results }: Props) {
  const parentRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_H,
    overscan: 20,
  })

  const items = virtualizer.getVirtualItems()

  if (results.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <IconTableOff size={34} className="text-[#333]" />
        <span className="text-sm text-[#555]">No results match the current filters.</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div ref={headerRef} className="overflow-hidden border-b border-[#2a2a2a] shrink-0">
        <div
          className="grid text-[10px] text-[#555] uppercase tracking-wider px-3 h-8 items-center"
          style={gridStyle}
        >
          <span />
          <span className="min-w-0 truncate">Host</span>
          <span className="min-w-0 truncate text-right">Port</span>
          <span className="min-w-0 truncate">Protocol</span>
          <span className="min-w-0 truncate">Anonymity</span>
          <span className="min-w-0 truncate">Country</span>
          <span className="min-w-0 truncate">City</span>
          <span className="min-w-0 truncate">ISP</span>
          <span className="min-w-0 truncate text-right">Latency</span>
          <span className="min-w-0 truncate">Checked</span>
        </div>
      </div>

      <div
        ref={parentRef}
        className="flex-1 overflow-auto"
        onScroll={(event) => {
          if (headerRef.current) {
            headerRef.current.scrollLeft = event.currentTarget.scrollLeft
          }
        }}
      >
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative', minWidth: TABLE_MIN_WIDTH }}>
          {items.map((vRow) => {
            const r = results[vRow.index]
            return (
              <div
                key={vRow.key}
                data-index={vRow.index}
                ref={virtualizer.measureElement}
                className="grid items-center px-3 h-[34px] hover:bg-[#1c1c1c] transition-colors duration-150 row-in border-b border-[#1c1c1c] group"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${vRow.start}px)`,
                  ...gridStyle,
                }}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${r.alive ? 'bg-green-500' : 'bg-red-600'}`} />
                <span className="min-w-0 font-mono text-xs text-[#e8e8e8] truncate" title={r.host}>{r.host}</span>
                <span className="min-w-0 font-mono text-xs text-[#888] text-right tabular-nums">{r.port}</span>
                <span className="min-w-0"><ProtoBadge proto={r.protocol} /></span>
                <span className="min-w-0"><AnonBadge anon={r.anonymity} /></span>
                <span className="min-w-0 font-mono text-xs text-[#888] truncate">{r.geo?.countryCode || '-'}</span>
                <span className="min-w-0 text-xs text-[#555] truncate">{r.geo?.city || '-'}</span>
                <span className="min-w-0 text-xs text-[#555] truncate">{r.geo?.isp || '-'}</span>
                <span className="min-w-0 text-right tabular-nums">
                  {r.alive
                    ? <LatencyCell ms={r.latencyMs} />
                    : <span className="font-mono text-xs text-[#333]">-</span>
                  }
                </span>
                <span className="min-w-0 text-xs text-[#555] truncate">
                  {r.checkedAt ? relativeTime(r.checkedAt) : '-'}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
