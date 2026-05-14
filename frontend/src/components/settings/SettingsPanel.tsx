import { useEffect, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { GetSettings, SaveSettings } from '../../../wailsjs/go/main/App'
import type { AppSettings } from '../../types'

export default function SettingsPanel() {
  const { settings, setSettings } = useAppStore()
  const [local, setLocal] = useState<AppSettings>(settings)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    GetSettings().then(s => {
      setLocal(s)
      setSettings(s)
    })
  }, [])

  const save = async () => {
    await SaveSettings(local)
    setSettings(local)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const set = (key: keyof AppSettings, val: AppSettings[keyof AppSettings]) =>
    setLocal(prev => ({ ...prev, [key]: val }))

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-xl p-6 space-y-8">

        <section className="space-y-4">
          <h3 className="text-xs font-medium text-[#555] uppercase tracking-wider">Checking defaults</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-[#888] mb-1.5">
                <span>Default threads</span>
                <span className="font-mono">{local.defaultThreads}</span>
              </div>
              <input type="range" min={10} max={2000} step={10}
                value={local.defaultThreads}
                onChange={e => set('defaultThreads', Number(e.target.value))}
                className="w-full h-1 accent-blue-500" />
            </div>
            <div>
              <label className="text-xs text-[#888] block mb-1.5">Default timeout</label>
              <select
                value={local.defaultTimeout}
                onChange={e => set('defaultTimeout', Number(e.target.value))}
                className="bg-[#1c1c1c] border border-[#2a2a2a] rounded px-3 py-1.5 text-xs text-[#e8e8e8] focus:outline-none focus:border-blue-800"
              >
                {[2000, 5000, 10000, 20000, 30000].map(v => (
                  <option key={v} value={v}>{v / 1000}s</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-medium text-[#555] uppercase tracking-wider">Scraping</h3>
          <div className="space-y-3">
            {([
              ['checkOnScrape', 'Auto-start checking after scrape'],
              ['autoScrapeOnStart', 'Scrape on app start'],
            ] as [keyof AppSettings, string][]).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-[#888]">{label}</span>
                <button
                  onClick={() => set(key, !local[key])}
                  className={`w-8 h-4 rounded-full transition-colors ${local[key] ? 'bg-blue-600' : 'bg-[#333]'}`}
                >
                  <span className={`block w-3 h-3 rounded-full bg-white shadow transition-transform ${local[key] ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-medium text-[#555] uppercase tracking-wider">Export</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#888] block mb-1.5">Default format</label>
              <select
                value={local.exportFormat}
                onChange={e => set('exportFormat', e.target.value)}
                className="bg-[#1c1c1c] border border-[#2a2a2a] rounded px-3 py-1.5 text-xs text-[#e8e8e8] focus:outline-none focus:border-blue-800"
              >
                <option value="txt">TXT</option>
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#888] block mb-1.5">TXT line format</label>
              <select
                value={local.txtFormat}
                onChange={e => set('txtFormat', e.target.value)}
                className="bg-[#1c1c1c] border border-[#2a2a2a] rounded px-3 py-1.5 text-xs text-[#e8e8e8] focus:outline-none focus:border-blue-800"
              >
                <option value="host:port">ip:port</option>
                <option value="protocol://host:port">protocol://ip:port</option>
                <option value="host:port:user:pass">ip:port:user:pass</option>
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-xs font-medium text-[#555] uppercase tracking-wider">About</h3>
          <div className="text-xs text-[#555] space-y-1">
            <div>Version: <span className="text-[#888]">1.0.0</span></div>
            <div>
              GeoLite2:{' '}
              <span className="text-[#888]">
                Bundled — replace <code className="font-mono text-[#666]">files/GeoLite2-City.mmdb</code> for updates
              </span>
            </div>
          </div>
        </section>

        <button
          onClick={save}
          className={`px-5 py-2 rounded text-sm font-medium transition-colors ${
            saved
              ? 'bg-green-700 text-green-100'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          {saved ? 'Saved' : 'Save settings'}
        </button>
      </div>
    </div>
  )
}
