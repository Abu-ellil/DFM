'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  Truck,
  Package,
  DollarSign,
  TrendingUp,
  Calendar,
  RefreshCw,
  LogOut,
  ChevronRight,
  Activity
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

import { dashboardApi, DashboardStats, ActivityItem } from '../../lib/api'

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    customers: 0,
    weighbridge: 0,
    crates: 0,
    finance: 0
  })
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [authorized, setAuthorized] = useState(false)
  const [user, setUser] = useState<any>(null)

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, activityRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRecentActivity(5)
      ])

      if (statsRes.stats) {
        setStats(statsRes.stats)
      }

      if (Array.isArray(activityRes)) {
        setActivity(activityRes)
      } else if ((activityRes as any).activity) {
        setActivity((activityRes as any).activity)
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
  }, [router])

  const checkAuth = useCallback(() => {
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
  }, [router, fetchDashboardData])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

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

  const cratePieData = stats.charts
    ? [
        { name: 'صناديق بالخارج', value: stats.charts.crates.total_out },
        { name: 'صناديق مستردة', value: stats.charts.crates.total_returned }
      ]
    : []

  const COLORS = ['#f97316', '#22c55e', '#3b82f6', '#a855f7']

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
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
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 bg-white shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث البيانات
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('token')
              localStorage.removeItem('user')
              router.push('/login')
            }}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 shadow-sm transition-colors"
          >
            <LogOut className="w-4 h-4 ml-2" />
            تسجيل الخروج
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Monthly Weights Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="w-5 h-5 ml-2 text-green-600" />
            تحليل الأوزان الشهرية (كجم)
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.charts?.weights || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value) => [`${value} كجم`, 'الوزن']}
                />
                <Bar dataKey="total_weight" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Finance Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <DollarSign className="w-5 h-5 ml-2 text-purple-600" />
            التدفقات المالية الشهرية
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.charts?.finance || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total_paid"
                  name="مدفوعات"
                  stroke="#22c55e"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="total_received"
                  name="مقبوضات"
                  stroke="#f43f5e"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Crate Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <Package className="w-5 h-5 ml-2 text-orange-600" />
            توزيع الصناديق
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cratePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {cratePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">إجمالي الخارج:</span>
              <span className="font-bold">{stats.charts?.crates.total_out || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">إجمالي المسترد:</span>
              <span className="font-bold">{stats.charts?.crates.total_returned || 0}</span>
            </div>
            <div className="pt-2 border-t flex justify-between text-sm font-bold">
              <span>المتبقي بالخارج:</span>
              <span className="text-orange-600">
                {(stats.charts?.crates.total_out || 0) - (stats.charts?.crates.total_returned || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <Activity className="w-5 h-5 ml-2 text-blue-600" />
            آخر النشاطات
          </h3>
          <div className="space-y-4">
            {activity.length === 0 ? (
              <p className="text-gray-500 italic text-center py-8">لا توجد نشاطات حديثة</p>
            ) : (
              activity.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start p-3 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-50 last:border-0"
                >
                  <div
                    className={`p-2 rounded-full ml-4 ${
                      item.type === 'weighbridge'
                        ? 'bg-green-100 text-green-600'
                        : item.type === 'finance'
                          ? 'bg-purple-100 text-purple-600'
                          : 'bg-orange-100 text-orange-600'
                    }`}
                  >
                    {item.type === 'weighbridge' ? (
                      <Truck size={16} />
                    ) : item.type === 'finance' ? (
                      <DollarSign size={16} />
                    ) : (
                      <Package size={16} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(item.timestamp).toLocaleDateString('ar-EG')} -{' '}
                      {new Date(item.timestamp).toLocaleTimeString('ar-EG')}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              ))
            )}
          </div>
          <button className="w-full mt-6 py-2 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors">
            عرض كل النشاطات
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <h3 className="text-xl font-bold text-gray-900 mb-6">الوصول السريع</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <QuickActionCard
          title="إدارة العملاء"
          description="إضافة وتعديل بيانات الموردين والعملاء"
          icon={<Users className="w-8 h-8" />}
          href="/dashboard/customers"
        />
        <QuickActionCard
          title="سجلات الميزان"
          description="مراجعة عمليات الوزن اليومية والتفاصيل"
          icon={<Truck className="w-8 h-8" />}
          href="/dashboard/weighbridge"
        />
        <QuickActionCard
          title="حركة الصناديق"
          description="تتبع خروج وعودة الصناديق الفارغة"
          icon={<Package className="w-8 h-8" />}
          href="/dashboard/crates"
        />
      </div>

      {lastSync && (
        <div className="text-center text-sm text-gray-400 mt-8 border-t pt-4">
          آخر تحديث للبيانات: {lastSync.toLocaleDateString('ar-EG')}{' '}
          {lastSync.toLocaleTimeString('ar-EG')}
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
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colors[color] || colors.blue}`}>{icon}</div>
        <div className="mr-4 text-right">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          {loading ? (
            <div className="h-8 w-16 bg-gray-100 animate-pulse rounded mt-1"></div>
          ) : (
            <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
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
      className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-100 group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
        {icon}
      </div>
      <div className="text-orange-600 mb-4 group-hover:scale-110 transition-transform inline-block">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
      <div className="mt-4 flex items-center text-orange-600 text-sm font-bold group-hover:translate-x-[-4px] transition-transform">
        انتقل الآن <ChevronRight size={16} className="mr-1 rotate-180" />
      </div>
    </a>
  )
}
