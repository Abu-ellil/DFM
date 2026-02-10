'use client'

import { useState, useEffect } from 'react'
import { Users, Truck, Package, DollarSign, TrendingUp, Calendar, RefreshCw } from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    customers: 0,
    weighbridge: 0,
    crates: 0,
    finance: 0
  })
  const [loading, setLoading] = useState(true)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // In production, this would fetch from your API
      // For now, using mock data
      setTimeout(() => {
        setStats({
          customers: 156,
          weighbridge: 1243,
          crates: 8923,
          finance: 45678
        })
        setLastSync(new Date())
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
          <p className="text-gray-600 mt-1">نظرة عامة على عمليات المصنع</p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </button>
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
          title="نظرة عامة مالية"
          description="عرض المعاملات المالية"
          icon={<DollarSign className="w-8 h-8" />}
          href="/dashboard/finance"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 ml-2" />
          النشاط الأخير
        </h2>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">جاري تحميل النشاط الأخير...</div>
          ) : (
            <>
              <ActivityItem
                type="customer"
                message="تم إضافة عميل جديد: شركة ABC للتجارة"
                time="منذ ساعتين"
              />
              <ActivityItem
                type="weighbridge"
                message="تم إنشاء سجل ميزان رقم 1243"
                time="منذ 3 ساعات"
              />
              <ActivityItem type="finance" message="تم استلام دفعة: 5,000 ريال" time="منذ 5 ساعات" />
              <ActivityItem type="crate" message="تم تسليم صناديق: 250 وحدة" time="منذ 6 ساعات" />
            </>
          )}
        </div>
      </div>

      {/* Sync Status */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="w-5 h-5 ml-2" />
          حالة المزامنة
        </h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full ml-3"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">آخر مزامنة</p>
              <p className="text-sm text-gray-600">
                {lastSync ? lastSync.toLocaleString('ar-EG') : 'أبداً'}
              </p>
            </div>
          </div>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700">
            زامن الآن
          </button>
        </div>
      </div>
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
  value: number
  color: string
  loading: boolean
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600'
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {loading ? '...' : value.toLocaleString()}
          </p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
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
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer block"
    >
      <div className="flex items-start">
        <div className="text-primary-600 mr-4">{icon}</div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </a>
  )
}

function ActivityItem({ type, message, time }: { type: string; message: string; time: string }) {
  const typeIcons = {
    customer: <Users className="w-4 h-4 text-blue-600" />,
    weighbridge: <Truck className="w-4 h-4 text-green-600" />,
    finance: <DollarSign className="w-4 h-4 text-purple-600" />,
    crate: <Package className="w-4 h-4 text-orange-600" />
  }

  return (
    <div className="flex items-start py-3 border-b border-gray-100 last:border-0">
      <div className="mr-3 mt-0.5">{typeIcons[type as keyof typeof typeIcons]}</div>
      <div className="flex-1">
        <p className="text-sm text-gray-900">{message}</p>
        <p className="text-xs text-gray-500 mt-1">{time}</p>
      </div>
    </div>
  )
}
