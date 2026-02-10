'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  Truck,
  Package,
  DollarSign,
  TrendingUp,
  Calendar,
  RefreshCw,
  LogOut
} from 'lucide-react'

import { dashboardApi } from '../../lib/api'

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState({
    customers: 0,
    weighbridge: 0,
    crates: 0,
    finance: 0
  })
  const [loading, setLoading] = useState(true)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [authorized, setAuthorized] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = () => {
    const token = localStorage.getItem('token')
    const userJson = localStorage.getItem('user')

    if (!token || !userJson) {
      router.push('/login')
      return
    }

    try {
      const userData = JSON.parse(userJson)
      setUser(userData)
      setAuthorized(true)
      fetchDashboardData()
    } catch (e) {
      router.push('/login')
    }
  }

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const res = await dashboardApi.getStats()
      if (res.stats) {
        setStats(res.stats)
      }
      setLastSync(new Date())
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-orange-600 mb-4" />
          <p className="text-gray-600">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
          <p className="text-gray-600 mt-1">
            أهلاً بك، {user?.full_name} ({user?.factory_name || 'بدون مصنع'})
          </p>
        </div>
        <div className="flex items-center space-x-4 space-x-reverse">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('token')
              localStorage.removeItem('user')
              router.push('/login')
            }}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
          >
            <LogOut className="w-4 h-4 ml-2" />
            تسجيل الخروج
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Users className="w-6 h-6" />}
          title="إجمالي العملاء"
          value={stats.customers}
          color="blue"
          loading={loading}
        />
        <StatCard
          icon={<Truck className="w-6 h-6" />}
          title="سجلات الميزان"
          value={stats.weighbridge}
          color="green"
          loading={loading}
        />
        <StatCard
          icon={<Package className="w-6 h-6" />}
          title="الصناديق المتتبعة"
          value={stats.crates}
          color="orange"
          loading={loading}
        />
        <StatCard
          icon={<DollarSign className="w-6 h-6" />}
          title="السجلات المالية"
          value={stats.finance}
          color="purple"
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <QuickActionCard
          title="عرض العملاء"
          description="إدارة قاعدة بيانات العملاء"
          icon={<Users className="w-8 h-8" />}
          href="/dashboard/customers"
        />
        <QuickActionCard
          title="بيانات الميزان"
          description="تتبع معاملات الوزن"
          icon={<Truck className="w-8 h-8" />}
          href="/dashboard/weighbridge"
        />
        <QuickActionCard
          title="إدارة الصناديق"
          description="تتبع الصناديق والأنواع"
          icon={<Package className="w-8 h-8" />}
          href="/dashboard/crates"
        />
      </div>

      {lastSync && (
        <div className="text-left text-sm text-gray-500">
          آخر تحديث: {lastSync.toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon,
  title,
  value,
  color,
  loading
}: {
  icon: React.ReactNode
  title: string
  value: string | number
  color: string
  loading: boolean
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600'
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center">
        <div className={`p-3 rounded-md ${colors[color] || colors.blue}`}>{icon}</div>
        <div className="mr-4">
          <p className="text-sm font-medium text-gray-500 uppercase">{title}</p>
          {loading ? (
            <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
          ) : (
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function QuickActionCard({
  title,
  description,
  icon,
  href
}: {
  title: string
  description: string
  icon: React.ReactNode
  href: string
}) {
  return (
    <a
      href={href}
      className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100 group"
    >
      <div className="text-orange-600 mb-4 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </a>
  )
}
