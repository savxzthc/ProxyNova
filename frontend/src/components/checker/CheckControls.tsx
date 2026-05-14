import { IconPlayerPlay, IconPlayerStop } from '@tabler/icons-react'

interface Props {
  onStart: () => void
  onStop: () => void
  isChecking: boolean
  proxyCount: number
}

export default function CheckControls({ onStart, onStop, isChecking, proxyCount }: Props) {
  return (
    <div className="flex gap-3">
      <button
        onClick={onStart}
        disabled={isChecking || proxyCount === 0}
        className="flex items-center gap-2 px-5 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:bg-[#1c1c1c] disabled:text-[#555] disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
      >
        <IconPlayerPlay size={14} />
        Start checking
      </button>
      <button
        onClick={onStop}
        disabled={!isChecking}
        className="flex items-center gap-2 px-5 py-2 rounded bg-[#1c1c1c] hover:bg-[#242424] disabled:opacity-40 disabled:cursor-not-allowed text-[#888] hover:text-[#e8e8e8] text-sm font-medium border border-[#2a2a2a] transition-colors"
      >
        <IconPlayerStop size={14} />
        Stop
      </button>
    </div>
  )
}
