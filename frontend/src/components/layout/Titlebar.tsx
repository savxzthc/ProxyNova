import { IconShieldCheck } from '@tabler/icons-react'
import { WindowMinimise, WindowToggleMaximise, Quit } from '../../../wailsjs/runtime/runtime'

export default function Titlebar() {
  return (
    <div
      className="flex items-center justify-between h-9 px-3 bg-surface border-b border-[#2a2a2a] shrink-0"
      style={{ '--wails-draggable': 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2" style={{ '--wails-draggable': 'drag' } as React.CSSProperties}>
        <IconShieldCheck size={16} className="text-blue-400" />
        <span className="text-sm font-medium text-[#888]">ProxyNova</span>
      </div>
      <div className="flex items-center gap-1" style={{ '--wails-draggable': 'no-drag' } as React.CSSProperties}>
        <button
          onClick={() => WindowMinimise()}
          className="w-7 h-7 flex items-center justify-center rounded text-[#555] hover:text-[#e8e8e8] hover:bg-[#2a2a2a] transition-colors text-xs"
        >
          ─
        </button>
        <button
          onClick={() => WindowToggleMaximise()}
          className="w-7 h-7 flex items-center justify-center rounded text-[#555] hover:text-[#e8e8e8] hover:bg-[#2a2a2a] transition-colors text-xs"
        >
          □
        </button>
        <button
          onClick={() => Quit()}
          className="w-7 h-7 flex items-center justify-center rounded text-[#555] hover:text-white hover:bg-red-600 transition-colors text-xs"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
