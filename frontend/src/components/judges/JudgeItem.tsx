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
    <div className="flex items-center gap-3 p-3 rounded-lg border border-[#2a2a2a] bg-surface hover:bg-raised transition-colors duration-150">
      <button
        type="button"
        onClick={() => onChange({ ...judge, active: !judge.active })}
        className={`w-7 h-4 rounded-full shrink-0 transition-colors duration-150 ${judge.active ? 'bg-blue-600' : 'bg-[#333]'}`}
        aria-label={`${judge.active ? 'Disable' : 'Enable'} judge`}
      >
        <span className={`block w-3 h-3 rounded-full bg-white shadow transition-transform ${judge.active ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
      </button>

      <input
        type="text"
        value={judge.url}
        onChange={(e) => onChange({ ...judge, url: e.target.value })}
        className="flex-1 min-w-0 bg-[#111] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-xs font-mono text-[#e8e8e8] placeholder-[#555] focus:outline-none focus:border-blue-800 transition-colors duration-150"
        placeholder="https://example.com/judge"
      />

      <select
        value={judge.protocol}
        onChange={(e) => onChange({ ...judge, protocol: e.target.value })}
        className="bg-[#1c1c1c] border border-[#2a2a2a] rounded px-2 py-1.5 text-[10px] font-mono text-[#888] focus:outline-none focus:border-blue-800 transition-colors duration-150"
      >
        <option value="http">HTTP</option>
        <option value="https">HTTPS</option>
      </select>

      <span className={`min-w-[54px] text-right text-[10px] font-mono shrink-0 ${
        !result ? 'text-[#555]' : result.alive ? 'text-green-400' : 'text-red-400'
      }`}>
        {!result ? '-' : result.alive ? `${result.latencyMs}ms` : 'x'}
      </span>

      <button
        type="button"
        onClick={handleTest}
        disabled={testing}
        className="grid h-7 w-7 place-items-center rounded border border-[#2a2a2a] text-[#555] hover:text-blue-400 hover:border-blue-900 disabled:opacity-40 transition-colors duration-150"
        title="Test judge"
        aria-label="Test judge"
      >
        {testing ? (
          <span className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin block" />
        ) : (
          <IconPlayerPlay size={13} />
        )}
      </button>

      <button
        type="button"
        onClick={onDelete}
        className="grid h-7 w-7 place-items-center rounded border border-[#2a2a2a] text-[#555] hover:text-red-400 hover:border-red-900 transition-colors duration-150"
        title="Delete"
        aria-label="Delete judge"
      >
        <IconTrash size={13} />
      </button>
    </div>
  )
}
