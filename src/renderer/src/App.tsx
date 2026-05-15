import { useState, useEffect } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useAppStore } from './store/useAppStore'
import { useAuthStore } from './store/useAuthStore'
import { Login } from './components/Login'
import { ActivationScreen } from './components/ActivationScreen'
import Dashboard from './components/Dashboard'
import Customers from './components/Customers'
import Weighbridge from './components/Weighbridge'
import Suppliers from './components/Suppliers'
import Seasons from './components/Seasons'
import Crates from './components/Crates'
import Finance from './components/Finance'
import Reports from './components/Reports'
import Settings from './components/Settings'
import Duplicates from './components/Duplicates'
import CustomerDetails from './components/CustomerDetails'
import Sales from './components/Sales'
import { SyncStatus } from './components/SyncStatus'
import AutoUpdater from './components/AutoUpdater'
import { ThemeToggle } from './components/ThemeToggle'
import { FontSizeToggle } from './components/FontSizeToggle'
import appIconUrl from './assets/icon.ico?url'
import {
  LayoutDashboard,
  Users,
  Scale,
  Truck,
  Calendar,
  Package,
  Wallet,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  ChevronRight,
  Bell,
  Copy,
  ShoppingCart
} from 'lucide-react'

const TAB_TITLES: Record<string, string> = {
  dashboard: 'لوحة التحكم',
  weighbridge: 'الميزان',
  customers: 'العملاء',
  suppliers: 'الموردين',
  seasons: 'المواسم',
  crates: 'الصناديق',
  sales: 'المبيعات',
  finance: 'الحسابات',
  reports: 'التقارير',
  duplicates: 'العمليات المكررة',
  settings: 'الإعدادات'
}

function App(): React.ReactElement {
  const {
    version,
    isSidebarOpen,
    toggleSidebar,
    activeTab,
    setActiveTab,
    selectedCustomerId,
    navigateToCustomer
  } = useAppStore()
  const { user, setUser, logout } = useAuthStore()
  const [isLicensed, setIsLicensed] = useState<boolean | null>(null)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const [hasActiveSeason, setHasActiveSeason] = useState<boolean>(true)
  const [activeSeasonName, setActiveSeasonName] = useState<string | null>(null)

  const checkLicense = async (): Promise<void> => {
    try {
      if (!window.api || !window.api.license) {
        setIsLicensed(true)
        return
      }
      const licensed = await window.api.license.check()
      setIsLicensed(licensed)
    } catch (_error) {
      setIsLicensed(true)
    }
  }

  useEffect(() => {
    checkLicense()
    const checkSeason = async () => {
      try {
        const result = await window.api.seasons?.getActive()
        setHasActiveSeason(!!result)
        setActiveSeasonName(result?.name ?? null)
      } catch {
        setHasActiveSeason(false)
        setActiveSeasonName(null)
      }
    }
    checkSeason()
    const interval = setInterval(checkSeason, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isSmallScreen = windowWidth < 1024
  const isSidebarOpenResponsive = isSmallScreen ? false : isSidebarOpen

  const handleActivationSuccess = () => {
    setIsLicensed(true)
  }

  if (isLicensed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center" role="status" aria-live="polite">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري التحقق من الترخيص\u2026</p>
        </div>
      </div>
    )
  }

  if (!isLicensed) {
    return <ActivationScreen onActivationSuccess={handleActivationSuccess} />
  }

  if (!user) {
    return <Login onLoginSuccess={setUser} />
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'customers':
        return <Customers onViewCustomer={navigateToCustomer} />
      case 'suppliers':
        return <Suppliers />
      case 'seasons':
        return <Seasons />
      case 'customer-details':
        return selectedCustomerId ? (
          <CustomerDetails
            customerId={selectedCustomerId}
            onBack={() => setActiveTab('customers')}
          />
        ) : (
          <Customers onViewCustomer={navigateToCustomer} />
        )
      case 'weighbridge':
        return <Weighbridge />
      case 'crates':
        return <Crates />
      case 'sales':
        return <Sales />
      case 'finance':
        return <Finance />
      case 'reports':
        return <Reports />
      case 'duplicates':
        return <Duplicates />
      case 'settings':
        return <Settings />
      default:
        return <Dashboard />
    }
  }

  return (
    <div
      className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans"
      dir="rtl"
    >
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpenResponsive ? 'w-46' : 'w-16'
        } bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 transition-[width] duration-300 flex flex-col z-20 shadow-xl print:hidden`}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800">
          {isSidebarOpenResponsive && (
            <div className="flex items-center gap-2">
              <img src={appIconUrl} alt="DFM" className="w-8 h-8 rounded" width={32} height={32} />
              <span className="font-bold text-lg tracking-tight">DFM</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            aria-label={isSidebarOpenResponsive ? 'طي القائمة' : 'فتح القائمة'}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
          >
            {isSidebarOpenResponsive ? <ChevronRight size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto px-2 space-y-1">
          <NavItem
            icon={<LayoutDashboard size={20} />}
            label="الرئيسية"
            isOpen={isSidebarOpenResponsive}
            active={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
          />
          <NavItem
            icon={<Scale size={20} />}
            label="الميزان"
            isOpen={isSidebarOpenResponsive}
            active={activeTab === 'weighbridge'}
            onClick={() => setActiveTab('weighbridge')}
          />
          <NavItem
            icon={<Users size={20} />}
            label="العملاء"
            isOpen={isSidebarOpenResponsive}
            active={activeTab === 'customers'}
            onClick={() => setActiveTab('customers')}
          />
          <NavItem
            icon={<Truck size={20} />}
            label="الموردين"
            isOpen={isSidebarOpenResponsive}
            active={activeTab === 'suppliers'}
            onClick={() => setActiveTab('suppliers')}
          />
          <NavItem
            icon={<Calendar size={20} />}
            label="المواسم"
            isOpen={isSidebarOpenResponsive}
            active={activeTab === 'seasons'}
            onClick={() => setActiveTab('seasons')}
          />
          <NavItem
            icon={<Package size={20} />}
            label="الصناديق"
            isOpen={isSidebarOpenResponsive}
            active={activeTab === 'crates'}
            onClick={() => setActiveTab('crates')}
          />
          <NavItem
            icon={<ShoppingCart size={20} />}
            label="المبيعات"
            isOpen={isSidebarOpenResponsive}
            active={activeTab === 'sales'}
            onClick={() => setActiveTab('sales')}
          />
          <NavItem
            icon={<Wallet size={20} />}
            label="الحسابات"
            isOpen={isSidebarOpenResponsive}
            active={activeTab === 'finance'}
            onClick={() => setActiveTab('finance')}
          />
          <NavItem
            icon={<BarChart3 size={20} />}
            label="التقارير"
            isOpen={isSidebarOpenResponsive}
            active={activeTab === 'reports'}
            onClick={() => setActiveTab('reports')}
          />
          <NavItem
            icon={<Copy size={20} />}
            label="العمليات المكررة"
            isOpen={isSidebarOpenResponsive}
            active={activeTab === 'duplicates'}
            onClick={() => setActiveTab('duplicates')}
          />
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <NavItem
              icon={<SettingsIcon size={20} />}
              label="الإعدادات"
              isOpen={isSidebarOpenResponsive}
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
            />
            <NavItem
              icon={<LogOut size={20} />}
              label="خروج"
              isOpen={isSidebarOpenResponsive}
              onClick={logout}
              className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            />
          </div>

          {/* Contact Developer - Always visible */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-2 mt-2">
            <a
              href="https://wa.me/201221089249"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <NavItem
                icon={
                  <svg className="w-5 h-5 fill-current text-emerald-500" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                }
                label="تواصل مع المطور"
                isOpen={isSidebarOpenResponsive}
                className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20 !text-emerald-600 dark:!text-emerald-400 hover:!text-emerald-700"
              />
            </a>
            {isSidebarOpenResponsive && (
              <div className="text-[10px] text-slate-400 text-center px-3 pb-2">
                الإصدار {version}
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-10 shadow-sm print:hidden">
          <div className="flex items-center gap-4">
            <h1 className="font-bold text-xl text-slate-800 dark:text-white capitalize">
              {TAB_TITLES[activeTab] || activeTab}
            </h1>
            {activeSeasonName && activeTab !== 'seasons' && (
              <span className="flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-full">
                <Calendar size={14} />
                {activeSeasonName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <SyncStatus />
            <FontSizeToggle />
            <ThemeToggle />
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>
            <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none" aria-label="الإشعارات">
              <Bell size={20} aria-hidden="true" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" aria-hidden="true"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="text-left hidden sm:block">
                <p className="text-sm font-bold leading-none">{user.username}</p>
                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
                  {user.role}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20">
                {user.username.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar print:p-0 print:overflow-visible">
          {!hasActiveSeason && activeTab !== 'seasons' && (
            <div className="mb-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar size={24} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <p className="font-bold text-amber-800 dark:text-amber-200">لا يوجد موسم نشط</p>
                  <p className="text-sm text-amber-600 dark:text-amber-400">يجب تفعيل موسم أولاً لإضافة بيانات جديدة</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('seasons')}
                className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors font-bold text-sm shrink-0"
              >
                الذهاب للمواسم
              </button>
            </div>
          )}
          {renderContent()}
        </div>
      </main>
      <ToastContainer position="bottom-right" theme="colored" rtl />
      <AutoUpdater />
    </div>
  )
}

function NavItem({ icon, label, isOpen, active = false, onClick, className = '' }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
        active
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
      } ${className}`}
    >
      <div
        className={`${active ? 'text-white' : 'group-hover:text-emerald-600'} transition-colors`}
      >
        {icon}
      </div>
      {isOpen && <span className="font-bold text-sm tracking-wide">{label}</span>}
    </button>
  )
}

export default App
