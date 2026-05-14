import { useEffect, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { GetJudges, SaveJudges, TestJudge } from '../../../wailsjs/go/main/App'
import { IconPlus, IconGavel } from '@tabler/icons-react'
import JudgeItem from './JudgeItem'
import type { Judge } from '../../types'

export default function JudgesPanel() {
  const { judges, setJudges } = useAppStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    GetJudges().then(j => {
      setJudges(j)
      setLoading(false)
    })
  }, [])

  const update = async (updated: Judge[]) => {
    setJudges(updated)
    await SaveJudges(updated)
  }

  const handleAdd = () => {
    const newJudge: Judge = {
      id: `j${Date.now()}`,
      url: 'http://',
      protocol: 'http',
      active: true,
      notes: '',
    }
    update([...judges, newJudge])
  }

  const handleChange = (idx: number, j: Judge) => {
    const updated = [...judges]
    updated[idx] = j
    update(updated)
  }

  const handleDelete = (idx: number) => {
    update(judges.filter((_, i) => i !== idx))
  }

  const handleTest = async (url: string) => {
    const res = await TestJudge(url)
    return res as { alive: boolean; latencyMs: number }
  }

  if (loading) return null

  if (judges.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <IconGavel size={36} className="text-[#333]" />
        <span className="text-sm text-[#555]">Add a judge to get started</span>
        <button onClick={handleAdd} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
          + Add judge
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2a2a] shrink-0">
        <span className="text-sm text-[#888]">{judges.length} judges</span>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 ml-auto px-3 py-1.5 rounded bg-[#1c1c1c] border border-[#2a2a2a] text-xs text-[#888] hover:text-[#e8e8e8] transition-colors"
        >
          <IconPlus size={12} />
          Add judge
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {judges.map((j, i) => (
          <JudgeItem
            key={j.id}
            judge={j}
            onChange={(updated) => handleChange(i, updated)}
            onDelete={() => handleDelete(i)}
            onTest={() => handleTest(j.url)}
          />
        ))}
      </div>
    </div>
  )
}
