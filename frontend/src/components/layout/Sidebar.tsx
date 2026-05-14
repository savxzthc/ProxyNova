import {
  IconShieldCheck,
  IconWorld,
  IconTable,
  IconGavel,
  IconSettings,
} from '@tabler/icons-react'
import { useAppStore } from '../../store/appStore'

const nav = [
  { id: 'checker', label: 'Checker', Icon: IconShieldCheck },
  { id: 'scraper', label: 'Scraper', Icon: IconWorld },
  { id: 'results', label: 'Results', Icon: IconTable },
  { id: 'judges', label: 'Judges', Icon: IconGavel },
  { id: 'settings', label: 'Settings', Icon: IconSettings },
]

export default function Sidebar() {
  const { activePanel, setActivePanel } = useAppStore()

  return (
    <div className="flex flex-col w-[180px] shrink-0 bg-surface border-r border-[#2a2a2a] py-2">
      {nav.map(({ id, label, Icon }) => {
        const active = activePanel === id
        return (
          <button
            key={id}
            onClick={() => setActivePanel(id)}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
              active
                ? 'text-[#e8e8e8] bg-[#1c1c1c]'
                : 'text-[#888] hover:text-[#e8e8e8] hover:bg-[#1a1a1a]'
            }`}
          >
            <Icon size={16} className={active ? 'text-blue-400' : ''} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
