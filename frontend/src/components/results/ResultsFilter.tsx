import type { ResultFilter } from '../../types'

interface Props {
  filter: ResultFilter
  onChange: (f: ResultFilter) => void
}

const protoOpts = ['http', 'https', 'socks4', 'socks5']
const anonOpts = ['elite', 'anonymous', 'transparent']

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-all ${
        active
          ? 'bg-blue-950 text-blue-400 border-blue-800'
          : 'bg-[#1c1c1c] text-[#555] border-[#2a2a2a] hover:text-[#888]'
      }`}
    >
      {label}
    </button>
  )
}

export default function ResultsFilter({ filter, onChange }: Props) {
  const toggle = (key: 'protocols' | 'anonymity', val: string) => {
    const arr = filter[key]
    onChange({
      ...filter,
      [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val],
    })
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <input
        type="text"
        placeholder="Search..."
        value={filter.search}
        onChange={(e) => onChange({ ...filter, search: e.target.value })}
        className="bg-[#1c1c1c] border border-[#2a2a2a] rounded px-2.5 py-1 text-xs text-[#e8e8e8] placeholder-[#555] focus:outline-none focus:border-blue-800 w-36"
      />

      <div className="flex gap-1">
        {protoOpts.map(p => (
          <Chip key={p} label={p.toUpperCase()} active={filter.protocols.includes(p)} onClick={() => toggle('protocols', p)} />
        ))}
      </div>

      <div className="flex gap-1">
        {anonOpts.map(a => (
          <Chip key={a} label={a.charAt(0).toUpperCase() + a.slice(1)} active={filter.anonymity.includes(a)} onClick={() => toggle('anonymity', a)} />
        ))}
      </div>

      <button
        onClick={() => onChange({ ...filter, aliveOnly: !filter.aliveOnly })}
        className={`text-[10px] px-2 py-0.5 rounded border transition-all ${
          filter.aliveOnly
            ? 'bg-green-950 text-green-400 border-green-800'
            : 'bg-[#1c1c1c] text-[#555] border-[#2a2a2a] hover:text-[#888]'
        }`}
      >
        alive only
      </button>
    </div>
  )
}
