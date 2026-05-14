interface Props {
  selected: string[]
  onChange: (protocols: string[]) => void
  threads: number
  onThreadsChange: (v: number) => void
  timeout: number
  onTimeoutChange: (v: number) => void
}

const protocols = ['http', 'https', 'socks4', 'socks5']

export default function ProtocolToggles({
  selected, onChange, threads, onThreadsChange, timeout, onTimeoutChange
}: Props) {
  const toggle = (p: string) => {
    if (selected.includes(p)) {
      if (selected.length === 1) return
      onChange(selected.filter(x => x !== p))
    } else {
      onChange([...selected, p])
    }
  }

  return (
    <div className="rounded-lg border border-[#2a2a2a] bg-surface p-4 space-y-4">
      <div>
        <div className="text-xs text-[#555] mb-2">Protocols</div>
        <div className="flex gap-2">
          {protocols.map((p) => (
            <button
              key={p}
              onClick={() => toggle(p)}
              className={`px-3 py-1 rounded text-xs font-mono font-medium border transition-all ${
                selected.includes(p)
                  ? p === 'http'    ? 'bg-blue-950 text-blue-400 border-blue-800'
                  : p === 'https'   ? 'bg-green-950 text-green-400 border-green-800'
                  : p === 'socks4'  ? 'bg-purple-950 text-purple-400 border-purple-800'
                                    : 'bg-amber-950 text-amber-400 border-amber-800'
                  : 'bg-[#1c1c1c] text-[#555] border-[#2a2a2a]'
              }`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-[#555] mb-1.5">
          <span>Threads</span>
          <span className="font-mono text-[#888]">{threads}</span>
        </div>
        <input
          type="range"
          min={10}
          max={2000}
          step={10}
          value={threads}
          onChange={(e) => onThreadsChange(Number(e.target.value))}
          className="w-full h-1 accent-blue-500 cursor-pointer"
        />
      </div>

      <div>
        <div className="flex justify-between text-xs text-[#555] mb-1.5">
          <span>Timeout</span>
          <span className="font-mono text-[#888]">{timeout}ms</span>
        </div>
        <input
          type="range"
          min={1000}
          max={30000}
          step={1000}
          value={timeout}
          onChange={(e) => onTimeoutChange(Number(e.target.value))}
          className="w-full h-1 accent-blue-500 cursor-pointer"
        />
      </div>
    </div>
  )
}
