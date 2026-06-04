import { IconMinus, IconShieldCheck, IconSquare, IconX } from '@tabler/icons-react'
import { WindowMinimise, WindowToggleMaximise, Quit } from '../../../wailsjs/runtime/runtime'

export default function Titlebar() {
  return (
    <div
      className="flex items-center h-10 bg-surface border-b border-[#2a2a2a] shrink-0"
      style={{ '--wails-draggable': 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 px-3 min-w-[184px]" style={{ '--wails-draggable': 'drag' } as React.CSSProperties}>
        <span className="grid h-6 w-6 place-items-center rounded bg-blue-950 border border-blue-800">
          <IconShieldCheck size={14} className="text-blue-400" />
        </span>
        <span className="text-sm font-medium text-[#e8e8e8]">ProxyNova</span>
      </div>
      <div className="flex-1 h-full" style={{ '--wails-draggable': 'drag' } as React.CSSProperties} />
      <div className="flex items-center h-full" style={{ '--wails-draggable': 'no-drag' } as React.CSSProperties}>
        <button
          onClick={() => WindowMinimise()}
          className="w-10 h-10 flex items-center justify-center text-[#666] hover:text-[#e8e8e8] hover:bg-[#1c1c1c] transition-colors duration-150 text-sm"
          aria-label="Minimize"
        >
          <IconMinus size={14} />
        </button>
        <button
          onClick={() => WindowToggleMaximise()}
          className="w-10 h-10 flex items-center justify-center text-[#666] hover:text-[#e8e8e8] hover:bg-[#1c1c1c] transition-colors duration-150 text-sm"
          aria-label="Maximize"
        >
          <IconSquare size={13} />
        </button>
        <button
          onClick={() => Quit()}
          className="w-10 h-10 flex items-center justify-center text-[#666] hover:text-white hover:bg-red-700 transition-colors duration-150 text-sm"
          aria-label="Close"
        >
          <IconX size={15} />
        </button>
      </div>
    </div>
  )
}
