import { SETTINGS_SECTIONS } from './types'

interface SettingsSidebarProps {
  activeSection: string
  onSectionChange: (sectionId: string) => void
}

export function SettingsSidebar({ activeSection, onSectionChange }: SettingsSidebarProps) {
  return (
    <div className="w-64 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">الإعدادات</h2>
      </div>

      <nav className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon
          const isActive = activeSection === section.id

          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                ${isActive
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }
              `}
            >
              <Icon size={18} className={isActive ? 'text-emerald-600 dark:text-emerald-400' : ''} />
              <div className="flex-1 text-right">
                <div className="text-sm font-bold">{section.label}</div>
                <div className={`text-xs mt-0.5 ${isActive ? 'text-emerald-600/70 dark:text-emerald-400/70' : 'text-slate-400'}`}>
                  {section.description}
                </div>
              </div>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
