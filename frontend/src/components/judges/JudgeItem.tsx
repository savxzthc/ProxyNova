import { useState } from 'react'
import { IconTrash, IconPlayerPlay } from '@tabler/icons-react'
import type { Judge } from '../../types'

interface Props {
  judge: Judge
  onChange: (j: Judge) => void
  onDelete: () => void
  onTest: () => Promise<{ alive: boolean; latencyMs: number }>
}

export default function JudgeItem({ judge, onChange, onDelete, onTest }: Props) {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{ alive: boolean; latencyMs: number } | null>(null)

  const handleTest = async () => {
    setTesting(true)
    setResult(null)
    const r = await onTest()
    setResult(r)
    setTesting(false)
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-[#2a2a2a] bg-surface hover:bg-raised transition-colors">
      <button
        onClick={() => onChange({ ...judge, active: !judge.active })}
        className={`w-7 h-4 rounded-full shrink-0 transition-colors ${judge.active ? 'bg-blue-600' : 'bg-[#333]'}`}
      >
        <span className={`block w-3 h-3 rounded-full bg-white shadow transition-transform ${judge.active ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
      </button>

      <input
        type="text"
        value={judge.url}
        onChange={(e) => onChange({ ...judge, url: e.target.value })}
        className="flex-1 bg-transparent text-xs font-mono text-[#e8e8e8] focus:outline-none min-w-0"
        placeholder="https://example.com/judge"
      />

      <select
        value={judge.protocol}
        onChange={(e) => onChange({ ...judge, protocol: e.target.value })}
        className="bg-[#1c1c1c] border border-[#2a2a2a] rounded px-2 py-0.5 text-[10px] font-mono text-[#888] focus:outline-none"
      >
        <option value="http">HTTP</option>
        <option value="https">HTTPS</option>
      </select>

      {result && (
        <span className={`text-[10px] font-mono shrink-0 ${result.alive ? 'text-green-400' : 'text-red-400'}`}>
          {result.alive ? `${result.latencyMs}ms` : 'failed'}
        </span>
      )}

      <button
        onClick={handleTest}
        disabled={testing}
        className="p-1 text-[#555] hover:text-blue-400 disabled:opacity-40 transition-colors"
        title="Test judge"
      >
        {testing ? (
          <span className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin block" />
        ) : (
          <IconPlayerPlay size={13} />
        )}
      </button>

      <button
        onClick={onDelete}
        className="p-1 text-[#555] hover:text-red-400 transition-colors"
        title="Delete"
      >
        <IconTrash size={13} />
      </button>
    </div>
  )
}
