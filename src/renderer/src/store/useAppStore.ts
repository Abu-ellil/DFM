import { create } from 'zustand'

interface AppState {
  version: string
  isSidebarOpen: boolean
  activeTab: string
  selectedCustomerId: number | null
  toggleSidebar: () => void
  setVersion: (version: string) => void
  setActiveTab: (tab: string) => void
  setSelectedCustomerId: (id: number | null) => void
  navigateToCustomer: (id: number) => void
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
  fontSize: number
  setFontSize: (size: number) => void
  increaseFontSize: () => void
  decreaseFontSize: () => void
}

export const useAppStore = create<AppState>((set, get) => {
  const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  const savedFontSize = parseInt(localStorage.getItem('fontSize') || '100')

  const applyThemeToDOM = (theme: 'light' | 'dark') => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(theme)
      console.log('Theme applied:', theme, document.documentElement.className)
    }
  }

  applyThemeToDOM(savedTheme)

  return {
    version: '2.0.0',
    isSidebarOpen: true,
    activeTab: 'dashboard',
    selectedCustomerId: null,
    theme: savedTheme,
    fontSize: savedFontSize,
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    setVersion: (version) => set({ version }),
    setActiveTab: (activeTab) => set({ activeTab }),
    setSelectedCustomerId: (selectedCustomerId) => set({ selectedCustomerId }),
    navigateToCustomer: (id) => set({ activeTab: 'customer-details', selectedCustomerId: id }),
    setTheme: (theme) => {
      localStorage.setItem('theme', theme)
      applyThemeToDOM(theme)
      set({ theme })
    },
    toggleTheme: () => {
      const newTheme = get().theme === 'light' ? 'dark' : 'light'
      get().setTheme(newTheme)
    },
    setFontSize: (size) => {
      const clampedSize = Math.min(Math.max(size, 85), 130)
      localStorage.setItem('fontSize', clampedSize.toString())
      document.documentElement.style.fontSize = `${clampedSize}%`
      set({ fontSize: clampedSize })
    },
    increaseFontSize: () => {
      const current = get().fontSize
      if (current < 130) {
        get().setFontSize(current + 5)
      }
    },
    decreaseFontSize: () => {
      const current = get().fontSize
      if (current > 85) {
        get().setFontSize(current - 5)
      }
    }
  }
})
