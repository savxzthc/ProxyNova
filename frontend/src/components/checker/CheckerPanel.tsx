import { useState, useCallback, useEffect, useRef } from 'react'
import { useAppStore } from '../../store/appStore'
import { StartChecking, StopChecking } from '../../../wailsjs/go/main/App'
import InputArea from './InputArea'
import ProtocolToggles from './ProtocolToggles'
import CheckControls from './CheckControls'
import LiveCounters from './LiveCounters'

export default function CheckerPanel() {
  const MAX_PROXIES = 100_000
  const { isChecking, progress, judges, settings, scrapedProxies, clearScrapedProxies } = useAppStore()
  const [proxies, setProxies] = useState<string[]>([])

  const handleSetProxies = (list: string[]) => {
    setProxies(list.slice(0, MAX_PROXIES))
  }
  const [protocols, setProtocols] = useState<string[]>(['http', 'https', 'socks4', 'socks5'])
  const [threads, setThreads] = useState(settings.defaultThreads || 200)
  const [timeout, setTimeout_] = useState(settings.defaultTimeout || 5000)
  const [loadedText, setLoadedText] = useState<string | undefined>(undefined)
  const didLoad = useRef(false)

  useEffect(() => {
    if (scrapedProxies.length > 0 && !didLoad.current) {
      didLoad.current = true
      setLoadedText(scrapedProxies.join('\n'))
      clearScrapedProxies()
    }
  }, [scrapedProxies])

  const handleStart = useCallback(async () => {
    if (proxies.length === 0) return
    await StartChecking(proxies, {
      threads,
      timeoutMs: timeout,
      protocols,
      judges,
      shuffle: false,
      retryCount: 0,
    })
  }, [proxies, threads, timeout, protocols, judges])

  const handleStop = useCallback(() => {
    StopChecking()
  }, [])

  const pct = progress && progress.total > 0
    ? Math.round((progress.checked / progress.total) * 100)
    : 0

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {isChecking && (
        <div className="h-[2px] shrink-0 bg-[#161616] overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, #3b82f6 ${100 - pct}%, #22c55e)`,
            }}
          />
        </div>
      )}

      <div className="flex flex-col gap-4 p-5 overflow-y-auto flex-1">
        <InputArea proxies={proxies} onChange={handleSetProxies} externalText={loadedText} />

        <ProtocolToggles
          selected={protocols}
          onChange={setProtocols}
          threads={threads}
          onThreadsChange={setThreads}
          timeout={timeout}
          onTimeoutChange={setTimeout_}
        />

        <CheckControls
          onStart={handleStart}
          onStop={handleStop}
          isChecking={isChecking}
          proxyCount={proxies.length}
        />

        {(isChecking || progress) && (
          <LiveCounters progress={progress} pct={pct} />
        )}
      </div>
    </div>
  )
}
