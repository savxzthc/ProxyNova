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
    <div className="flex flex-col w-[184px] shrink-0 bg-surface border-r border-[#2a2a2a] py-2">
      {nav.map(({ id, label, Icon }) => {
        const active = activePanel === id
        return (
          <button
            key={id}
            onClick={() => setActivePanel(id)}
            className={`relative flex items-center gap-3 mx-2 rounded-md px-3 py-2.5 text-sm border-l-2 transition-colors duration-150 ${
              active
                ? 'border-l-blue-500 text-[#e8e8e8] bg-[#1c1c1c]'
                : 'border-l-transparent text-[#888] hover:text-[#e8e8e8] hover:bg-[#1a1a1a]'
            }`}
          >
            <Icon size={16} className={active ? 'text-blue-400' : 'text-[#666]'} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
