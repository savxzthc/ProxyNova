import { useEffect, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { GetSources, StartScraping, StopScraping, SaveSources, ExportProxyList, OpenSaveDialog } from '../../../wailsjs/go/main/App'
import SourceGrid from './SourceGrid'
import { IconWorldDownload, IconPlus, IconArrowRight, IconDownload, IconX, IconCheck } from '@tabler/icons-react'
import type { ScrapeSource } from '../../types'

function AddSourceForm({ onAdd, onCancel }: { onAdd: (src: ScrapeSource) => void; onCancel: () => void }) {
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    setError('')
    if (!url) { setError('URL is required'); return }
    try {
      const parsed = new URL(url)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setError('Only http:// and https:// URLs are allowed')
        return
      }
    } catch {
      setError('Invalid URL')
      return
    }
    onAdd({
      id: `custom-${Date.now()}`,
      name: name.trim() || url,
      url: url.trim(),
      active: true,
      lastScraped: '',
      lastCount: 0,
    })
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#2a2a2a] bg-[#111] shrink-0">
      <input
        autoFocus
        type="text"
        placeholder="https://example.com/proxies.txt"
        value={url}
        onChange={e => setUrl(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        className="flex-1 bg-[#1c1c1c] border border-[#2a2a2a] rounded px-2.5 py-1 text-xs font-mono text-[#e8e8e8] placeholder-[#444] focus:outline-none focus:border-blue-800"
      />
      <input
        type="text"
        placeholder="Name (optional)"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        className="w-36 bg-[#1c1c1c] border border-[#2a2a2a] rounded px-2.5 py-1 text-xs text-[#e8e8e8] placeholder-[#444] focus:outline-none focus:border-blue-800"
      />
      {error && <span className="text-xs text-red-400 shrink-0">{error}</span>}
      <button onClick={handleSubmit} className="p-1 text-green-400 hover:text-green-300 transition-colors">
        <IconCheck size={14} />
      </button>
      <button onClick={onCancel} className="p-1 text-[#555] hover:text-[#888] transition-colors">
        <IconX size={14} />
      </button>
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
  const [showAdd, setShowAdd] = useState(false)

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

  const handleToggle = async (id: string) => {
    const updated = sources.map(s => s.id === id ? { ...s, active: !s.active } : s)
    setSources(updated)
    await SaveSources(updated)
  }

  const handleAddSource = async (src: ScrapeSource) => {
    const updated = [...sources, src]
    setSources(updated)
    await SaveSources(updated)
    setShowAdd(false)
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
          className={`flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium transition-colors ${
            isScraping
              ? 'bg-[#1c1c1c] border border-[#2a2a2a] text-[#888] hover:text-red-400'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <IconWorldDownload size={14} />
          {isScraping ? 'Stop scraping' : 'Scrape all active'}
        </button>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1c1c1c] border border-[#2a2a2a] text-xs text-[#888] hover:text-[#e8e8e8] transition-colors"
        >
          <IconPlus size={12} />
          Add source
        </button>
        <span className="text-xs text-[#555] ml-auto">
          {activeSrcCount} active sources
        </span>
      </div>

      {showAdd && (
        <AddSourceForm
          onAdd={handleAddSource}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {isScraping && (
        <div className="px-4 py-2 bg-[#0f1a2a] border-b border-[#1e3a5a] text-xs text-blue-400 shrink-0">
          Scraped <span className="font-mono">{totalScrapeCount.toLocaleString()}</span> proxies
          from <span className="font-mono">{doneSources}</span> / <span className="font-mono">{activeSrcCount}</span> sources...
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
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#1c1c1c] border border-[#2a2a2a] text-xs text-[#888] hover:text-[#e8e8e8] transition-colors"
            >
              <IconDownload size={12} />
              Export TXT
            </button>
            <button
              onClick={() => setActivePanel('checker')}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-green-700 hover:bg-green-600 text-xs text-white font-medium transition-colors"
            >
              Load into checker
              <IconArrowRight size={12} />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        <SourceGrid
          sources={sources}
          statuses={scrapeStatuses}
          onToggle={handleToggle}
          isScraping={isScraping}
        />
      </div>
    </div>
  )
}
