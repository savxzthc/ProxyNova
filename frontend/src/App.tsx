import { useEffect } from 'react'
import { EventsOn, EventsOff } from '../wailsjs/runtime/runtime'
import { GetSettings, GetJudges, GetSources, GetIP } from '../wailsjs/go/main/App'
import { useAppStore } from './store/appStore'
import Titlebar from './components/layout/Titlebar'
import Sidebar from './components/layout/Sidebar'
import StatusBar from './components/layout/StatusBar'
import CheckerPanel from './components/checker/CheckerPanel'
import ResultsPanel from './components/results/ResultsPanel'
import ScraperPanel from './components/scraper/ScraperPanel'
import JudgesPanel from './components/judges/JudgesPanel'
import SettingsPanel from './components/settings/SettingsPanel'
import type { CheckProgress, Result, ScrapeProgress } from './types'

export default function App() {
  const {
    activePanel,
    setSettings,
    setJudges,
    setSources,
    setMyIP,
    setChecking,
    setProgress,
    addResults,
    setScraping,
    updateScrapeStatus,
    setScrapedProxies,
  } = useAppStore()

  useEffect(() => {
    Promise.all([GetSettings(), GetJudges(), GetSources(), GetIP()]).then(
      ([s, j, src, ip]) => {
        setSettings(s)
        setJudges(j)
        setSources(src)
        setMyIP(ip)
      }
    )

    const events = ['checker:progress', 'checker:result', 'checker:done', 'scraper:progress', 'scraper:done']

    EventsOn('checker:progress', (p: CheckProgress) => {
      setChecking(true)
      setProgress(p)
    })
    EventsOn('checker:result', (r: Result) => {
      addResults([r])
    })
    EventsOn('checker:done', (p: CheckProgress) => {
      setChecking(false)
      setProgress(p)
    })
    EventsOn('scraper:progress', (p: ScrapeProgress) => {
      setScraping(true)
      updateScrapeStatus(p)
    })
    EventsOn('scraper:done', (proxies: string[]) => {
      setScraping(false)
      setScrapedProxies(proxies || [])
    })

    return () => {
      events.forEach(e => EventsOff(e))
    }
  }, [])

  const panels: Record<string, React.ReactNode> = {
    checker: <CheckerPanel />,
    results: <ResultsPanel />,
    scraper: <ScraperPanel />,
    judges: <JudgesPanel />,
    settings: <SettingsPanel />,
  }

  return (
    <div className="flex flex-col h-screen bg-bg overflow-hidden">
      <Titlebar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden bg-bg">
          {panels[activePanel] || null}
        </main>
      </div>
      <StatusBar />
    </div>
  )
}
