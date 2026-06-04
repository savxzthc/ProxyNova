import { useEffect, useRef } from 'react'
import type { CheckProgress } from '../../types'

interface Props {
  progress: CheckProgress | null
  pct: number
}

function AnimatedCount({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const prev = useRef(value)

  useEffect(() => {
    if (ref.current && value !== prev.current) {
      ref.current.classList.remove('flash')
      void ref.current.offsetWidth
      ref.current.classList.add('flash')
      prev.current = value
    }
  }, [value])

  return (
    <span ref={ref} className="font-mono text-lg font-medium text-[#e8e8e8]">
      {value.toLocaleString()}
    </span>
  )
}

export default function LiveCounters({ progress, pct }: Props) {
  if (!progress) return null

  const pp = progress.perProtocol || {}
  const running = progress.checked < progress.total

  return (
    <div className="rounded-lg border border-[#2a2a2a] bg-surface p-4 space-y-4">
      <div className="flex items-center gap-3 text-xs text-[#555]">
        <div className="flex-1 bg-[#1c1c1c] rounded-full h-[3px] overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, #3b82f6 ${100 - pct}%, #22c55e)`,
            }}
          />
        </div>
        <span className="font-mono shrink-0">{pct}%</span>
      </div>

      <div className="text-xs text-[#555]">
        <span className="font-mono text-[#888]">
          {progress.checked.toLocaleString()} / {progress.total.toLocaleString()}
        </span>{' '}
        checked
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: progress.total, color: 'text-[#e8e8e8]' },
          { label: 'Alive', value: progress.alive, color: 'text-green-400' },
          { label: 'Dead', value: progress.dead, color: 'text-red-400' },
          { label: 'Rate', value: null, rate: progress.ratePerSec },
        ].map(({ label, value, color, rate }) => (
          <div key={label} className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wider text-[#555]">{label}</span>
            {rate !== undefined ? (
              <span className="flex items-center gap-2 font-mono text-lg font-medium text-[#888]">
                {running && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
                {rate.toFixed(0)}/s
              </span>
            ) : (
              <span className={color}>
                <AnimatedCount value={value!} />
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-4">
        {['http', 'https', 'socks4', 'socks5'].map((proto) => (
          <div key={proto} className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wider text-[#555]">{proto.toUpperCase()}</span>
            <span className="font-mono text-sm text-[#888]">
              {(pp[proto] || 0).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
