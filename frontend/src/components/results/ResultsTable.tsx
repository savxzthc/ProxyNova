import { useRef, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Result } from '../../types'

interface Props {
  results: Result[]
}

const countryFlag = (code: string) => {
  if (!code || code.length !== 2) return '🌐'
  return code.toUpperCase().replace(/./g, c =>
    String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0))
  )
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
    anon === 'transparent' ? 'Trans' : '—'
  return (
    <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border ${cls}`}>
      {label}
    </span>
  )
}

function LatencyCell({ ms }: { ms: number }) {
  const cls = ms < 500 ? 'text-green-400' : ms < 2000 ? 'text-yellow-400' : 'text-red-400'
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

const ROW_H = 32

export default function ResultsTable({ results }: Props) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_H,
    overscan: 20,
  })

  const items = virtualizer.getVirtualItems()

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="grid text-[10px] text-[#555] uppercase tracking-wider border-b border-[#2a2a2a] shrink-0 px-3 h-7 items-center"
        style={{ gridTemplateColumns: '16px 70px 1fr 90px 130px 110px 1fr 70px 80px' }}>
        <span />
        <span>Protocol</span>
        <span>Proxy</span>
        <span>Anonymity</span>
        <span>Country</span>
        <span>City</span>
        <span>ISP</span>
        <span>Latency</span>
        <span>Checked</span>
      </div>

      <div ref={parentRef} className="flex-1 overflow-auto">
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {items.map((vRow) => {
            const r = results[vRow.index]
            return (
              <div
                key={vRow.key}
                data-index={vRow.index}
                ref={virtualizer.measureElement}
                className="grid items-center px-3 h-8 hover:bg-raised transition-colors row-in border-b border-[#1c1c1c] group"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${vRow.start}px)`,
                  gridTemplateColumns: '16px 70px 1fr 90px 130px 110px 1fr 70px 80px',
                }}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${r.alive ? 'bg-green-500' : 'bg-red-600'}`} />
                <ProtoBadge proto={r.protocol} />
                <span className="font-mono text-xs text-[#e8e8e8] truncate">{r.host}:{r.port}</span>
                <AnonBadge anon={r.anonymity} />
                <span className="text-xs text-[#888] truncate">
                  {r.geo?.countryCode ? `${countryFlag(r.geo.countryCode)} ${r.geo.countryName}` : '—'}
                </span>
                <span className="text-xs text-[#555] truncate">{r.geo?.city || '—'}</span>
                <span className="text-xs text-[#555] truncate">{r.geo?.isp || '—'}</span>
                {r.alive
                  ? <LatencyCell ms={r.latencyMs} />
                  : <span className="text-xs text-[#333]">—</span>
                }
                <span className="text-xs text-[#555]">
                  {r.checkedAt ? relativeTime(r.checkedAt) : '—'}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
