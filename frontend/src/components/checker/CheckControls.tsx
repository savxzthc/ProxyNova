import { IconPlayerPlay, IconPlayerStop } from '@tabler/icons-react'

interface Props {
  onStart: () => void
  onStop: () => void
  isChecking: boolean
  proxyCount: number
}

export default function CheckControls({ onStart, onStop, isChecking, proxyCount }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={onStart}
        disabled={isChecking || proxyCount === 0}
        className="flex items-center gap-2 px-5 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:bg-[#1c1c1c] disabled:text-[#555] disabled:cursor-not-allowed text-white text-sm font-semibold shadow-sm shadow-blue-950/40 transition-colors duration-150"
      >
        <IconPlayerPlay size={14} />
        Start checking
      </button>
      <button
        type="button"
        onClick={onStop}
        disabled={!isChecking}
        className="flex items-center gap-2 px-5 py-2 rounded bg-red-950/40 border border-red-900/60 hover:bg-red-900/50 disabled:bg-[#1c1c1c] disabled:border-[#2a2a2a] disabled:text-[#555] disabled:opacity-60 disabled:cursor-not-allowed text-red-300 text-sm font-medium transition-colors duration-150"
      >
        <IconPlayerStop size={14} />
        Stop
      </button>
    </div>
  )
}
