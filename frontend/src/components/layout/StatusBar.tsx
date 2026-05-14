import { useAppStore } from '../../store/appStore'

export default function StatusBar() {
  const { myIP, isChecking, isScraping, results } = useAppStore()

  const status = isChecking ? 'checking' : isScraping ? 'scraping' : 'idle'
  const statusColor =
    status === 'idle' ? 'text-[#555]' : 'text-blue-400'

  return (
    <div className="flex items-center justify-between h-7 px-4 bg-surface border-t border-[#2a2a2a] shrink-0 text-[11px]">
      <div className="flex items-center gap-4">
        <span className="text-[#555]">
          IP: <span className="font-mono text-[#888]">{myIP || '—'}</span>
        </span>
        <span className="text-[#555]">
          Results: <span className="font-mono text-[#888]">{results.length.toLocaleString()}</span>
        </span>
      </div>
      <div className={`flex items-center gap-1.5 ${statusColor}`}>
        {status !== 'idle' && (
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
        )}
        {status}
      </div>
    </div>
  )
}
