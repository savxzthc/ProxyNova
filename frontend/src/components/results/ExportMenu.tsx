import { useState, useRef, useEffect } from 'react'
import { IconDownload } from '@tabler/icons-react'
import { ExportResults, OpenSaveDialog } from '../../../wailsjs/go/main/App'
import { useAppStore } from '../../store/appStore'
import type { ResultFilter } from '../../types'

interface Props {
  filter: ResultFilter
}

const formats = [
  { label: 'Export as TXT', ext: 'txt', fmt: 'txt' },
  { label: 'Export as CSV', ext: 'csv', fmt: 'csv' },
  { label: 'Export as JSON', ext: 'json', fmt: 'json' },
]

export default function ExportMenu({ filter }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { results } = useAppStore()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleExport = async (fmt: string, ext: string) => {
    setOpen(false)
    const path = await OpenSaveDialog(`proxies.${ext}`)
    if (!path) return
    await ExportResults(fmt, filter as any, path)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={results.length === 0}
        className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#1c1c1c] hover:bg-[#242424] border border-[#2a2a2a] text-xs text-[#888] hover:text-[#e8e8e8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <IconDownload size={12} />
        Export
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-[#1c1c1c] border border-[#2a2a2a] rounded shadow-xl z-50 min-w-[160px]">
          {formats.map(({ label, ext, fmt }) => (
            <button
              key={fmt}
              onClick={() => handleExport(fmt, ext)}
              className="block w-full text-left px-3 py-2 text-xs text-[#888] hover:text-[#e8e8e8] hover:bg-[#242424] transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
