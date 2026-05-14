import { useCallback, useRef, useEffect } from 'react'
import { OpenFileDialog, ReadFile } from '../../../wailsjs/go/main/App'
import { IconUpload, IconShieldOff } from '@tabler/icons-react'

interface Props {
  proxies: string[]
  onChange: (proxies: string[]) => void
  externalText?: string
}

export default function InputArea({ proxies, onChange, externalText }: Props) {
  const textRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (externalText !== undefined && textRef.current) {
      textRef.current.value = externalText
      const lines = externalText.split('\n').map(l => l.trim()).filter(Boolean)
      onChange(lines)
    }
  }, [externalText])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const lines = e.target.value.split('\n').map(l => l.trim()).filter(Boolean)
    onChange(lines)
  }, [onChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
      onChange(lines)
      if (textRef.current) textRef.current.value = text
    }
    reader.readAsText(file)
  }, [onChange])

  const handleOpen = useCallback(async () => {
    const path = await OpenFileDialog()
    if (!path) return
    try {
      const text = await ReadFile(path)
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
      onChange(lines)
      if (textRef.current) textRef.current.value = text
    } catch {}
  }, [onChange])

  return (
    <div
      className="relative rounded-lg border border-[#2a2a2a] bg-surface overflow-hidden"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {proxies.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-2 z-10">
          <IconShieldOff size={28} className="text-[#555]" />
          <span className="text-sm text-[#555]">Paste proxies here or drop a .txt file</span>
          <span className="text-xs text-[#444]">Supports ip:port · protocol://ip:port · ip:port:user:pass</span>
        </div>
      )}
      <textarea
        ref={textRef}
        className="w-full h-40 bg-transparent resize-none p-3 text-xs font-mono text-[#e8e8e8] placeholder-transparent focus:outline-none relative z-20"
        onChange={handleChange}
        spellCheck={false}
      />
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-[#2a2a2a] bg-[#111]">
        <span className="text-xs text-[#555]">
          {proxies.length > 0 ? (
            <span className="text-[#888]">{proxies.length.toLocaleString()} proxies loaded</span>
          ) : 'no proxies'}
        </span>
        <button
          onClick={handleOpen}
          className="flex items-center gap-1.5 text-xs text-[#888] hover:text-[#e8e8e8] transition-colors"
        >
          <IconUpload size={12} />
          open file
        </button>
      </div>
    </div>
  )
}
