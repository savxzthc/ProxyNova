import { useEffect, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { GetSources, StartScraping, StopScraping, SaveSources, ExportProxyList, OpenSaveDialog } from '../../../wailsjs/go/main/App'
import SourceGrid from './SourceGrid'
import { IconWorldDownload, IconArrowRight, IconDownload, IconCheck } from '@tabler/icons-react'
import type { ScrapeSource } from '../../types'

function AddSourceForm({ onAdd }: { onAdd: (src: ScrapeSource) => void }) {
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    setError('')
    const cleanURL = url.trim()
    const cleanName = name.trim()
    if (!cleanURL) {
      setError('URL is required')
      return
    }
    try {
      const parsed = new URL(cleanURL)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setError('Only http:// and https:// URLs are allowed')
        return
      }
    } catch {
      setError('Invalid URL')
      return
    }

    onAdd({
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: cleanName || cleanURL,
      url: cleanURL,
      active: true,
      lastScraped: '',
      lastCount: 0,
    })
    setUrl('')
    setName('')
  }

  return (
    <div className="rounded-lg border border-[#2a2a2a] bg-surface p-3 shrink-0">
      <div className="mb-2 text-xs uppercase tracking-wider text-[#555]">Add source</div>
      <div className="flex flex-col lg:flex-row gap-2">
        <input
          type="text"
          placeholder="Display name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          className="lg:w-44 bg-[#1c1c1c] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-xs text-[#e8e8e8] placeholder-[#555] focus:outline-none focus:border-blue-800 transition-colors duration-150"
        />
        <input
          type="text"
          placeholder="https://example.com/proxies.txt"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          className="flex-1 bg-[#1c1c1c] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-xs font-mono text-[#e8e8e8] placeholder-[#555] focus:outline-none focus:border-blue-800 transition-colors duration-150"
        />
        <button
          type="button"
          onClick={handleSubmit}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white transition-colors duration-150"
        >
          <IconCheck size={13} />
          Add
        </button>
      </div>
      {error && <div className="mt-2 text-xs text-red-400">{error}</div>}
    </div>
  )
}

export default function ScraperPanel() {
  const {
    isScraping, setScraping,
    sources, setSources,
    scrapeStatuses,
    scrapedProxies,
    setActivePanel,
  } = useAppStore()

  useEffect(() => {
    GetSources().then(setSources)
  }, [])

  const handleScrapeAll = async () => {
    setScraping(true)
    const activeIds = sources.filter(s => s.active).map(s => s.id)
    await StartScraping(activeIds)
  }

  const handleStop = () => {
    StopScraping()
    setScraping(false)
  }

  const saveSources = async (updated: ScrapeSource[]) => {
    setSources(updated)
    await SaveSources(updated as any)
  }

  const handleToggle = async (id: string) => {
    await saveSources(sources.map(s => s.id === id ? { ...s, active: !s.active } : s))
  }

  const handleAddSource = async (src: ScrapeSource) => {
    await saveSources([...sources, src])
  }

  const handleDeleteSource = async (id: string) => {
    await saveSources(sources.filter(s => s.id !== id))
  }

  const handleExport = async () => {
    if (scrapedProxies.length === 0) return
    const path = await OpenSaveDialog('scraped-proxies.txt')
    if (!path) return
    await ExportProxyList(scrapedProxies, path)
  }

  const totalScrapeCount = Object.values(scrapeStatuses).reduce((acc, s) => acc + (s.count || 0), 0)
  const doneSources = Object.values(scrapeStatuses).filter(s => s.done).length
  const activeSrcCount = sources.filter(s => s.active).length
  const hasScrapeResults = scrapedProxies.length > 0

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2a2a] shrink-0">
        <button
          onClick={isScraping ? handleStop : handleScrapeAll}
          disabled={activeSrcCount === 0}
          className={`flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium transition-colors duration-150 ${
            isScraping
              ? 'bg-red-950/40 border border-red-900/70 text-red-300 hover:bg-red-900/50'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-950/40'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <IconWorldDownload size={14} />
          {isScraping ? 'Stop scraping' : 'Scrape all active'}
        </button>
        <span className="text-xs text-[#555] ml-auto">
          {activeSrcCount} active sources
        </span>
      </div>

      {isScraping && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[#0f1a2a] border-b border-[#1e3a5a] text-xs text-blue-400 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Scraped <span className="font-mono">{totalScrapeCount.toLocaleString()}</span> proxies
          from <span className="font-mono">{doneSources}</span> / <span className="font-mono">{activeSrcCount}</span> sources
        </div>
      )}

      {!isScraping && hasScrapeResults && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-[#0a1a0f] border-b border-[#1a3a22] shrink-0">
          <span className="text-xs text-green-400">
            <span className="font-mono font-medium">{scrapedProxies.length.toLocaleString()}</span> unique proxies scraped
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#1c1c1c] border border-[#2a2a2a] text-xs text-[#888] hover:text-[#e8e8e8] transition-colors duration-150"
            >
              <IconDownload size={12} />
              Export TXT
            </button>
            <button
              onClick={() => setActivePanel('checker')}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-green-700 hover:bg-green-600 text-xs text-white font-medium transition-colors duration-150"
            >
              Load into checker
              <IconArrowRight size={12} />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <SourceGrid
          sources={sources}
          statuses={scrapeStatuses}
          onToggle={handleToggle}
          onDelete={handleDeleteSource}
          isScraping={isScraping}
        />
        <AddSourceForm onAdd={handleAddSource} />
      </div>
    </div>
  )
}
