import { create } from 'zustand'
import type { Result, CheckProgress, ScrapeSource, Judge, AppSettings, ScrapeProgress } from '../types'

interface AppStore {
  activePanel: string
  isChecking: boolean
  progress: CheckProgress | null
  results: Result[]
  isScraping: boolean
  sources: ScrapeSource[]
  scrapeStatuses: Record<string, ScrapeProgress>
  scrapedProxies: string[]
  judges: Judge[]
  settings: AppSettings
  myIP: string

  setActivePanel: (panel: string) => void
  addResults: (results: Result[]) => void
  clearResults: () => void
  setProgress: (p: CheckProgress) => void
  setChecking: (v: boolean) => void
  setScraping: (v: boolean) => void
  setSources: (sources: ScrapeSource[]) => void
  updateScrapeStatus: (p: ScrapeProgress) => void
  setScrapedProxies: (proxies: string[]) => void
  clearScrapedProxies: () => void
  setJudges: (judges: Judge[]) => void
  setSettings: (s: AppSettings) => void
  setMyIP: (ip: string) => void
}

const defaultSettings: AppSettings = {
  defaultThreads: 200,
  defaultTimeout: 5000,
  autoScrapeOnStart: false,
  exportFormat: 'txt',
  txtFormat: 'host:port',
  theme: 'dark',
  checkOnScrape: false,
}

export const useAppStore = create<AppStore>((set) => ({
  activePanel: 'checker',
  isChecking: false,
  progress: null,
  results: [],
  isScraping: false,
  sources: [],
  scrapeStatuses: {},
  scrapedProxies: [],
  judges: [],
  settings: defaultSettings,
  myIP: '',

  setActivePanel: (panel) => set({ activePanel: panel }),

  addResults: (newResults) =>
    set((state) => ({ results: [...state.results, ...newResults] })),

  clearResults: () => set({ results: [], progress: null }),

  setProgress: (p) => set({ progress: p }),

  setChecking: (v) => set({ isChecking: v }),

  setScraping: (v) => set({ isScraping: v }),

  setSources: (sources) => set({ sources }),

  updateScrapeStatus: (p) =>
    set((state) => ({
      scrapeStatuses: { ...state.scrapeStatuses, [p.sourceId]: p },
    })),

  setScrapedProxies: (proxies) => set({ scrapedProxies: proxies }),

  clearScrapedProxies: () => set({ scrapedProxies: [] }),

  setJudges: (judges) => set({ judges }),

  setSettings: (s) => set({ settings: s }),

  setMyIP: (ip) => set({ myIP: ip }),
}))
