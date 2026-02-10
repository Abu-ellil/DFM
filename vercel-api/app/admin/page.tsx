'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  Key,
  Factory,
  Settings,
  BarChart3,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  LogOut,
  Power,
  Ban,
  CheckCircle
} from 'lucide-react'
import { adminApi } from '../../lib/api'

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeLicenses: 0,
    totalFactories: 0,
    systemHealth: 'good'
  })
  const [users, setUsers] = useState<any[]>([])
  const [licenses, setLicenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

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
      const user = JSON.parse(userJson)
      if (user.role !== 'admin') {
        router.push('/dashboard')
        return
      }
      setAuthorized(true)
      fetchAdminData()
    } catch (e) {
      router.push('/login')
    }
  }

  const fetchAdminData = async () => {
    setLoading(true)
    try {
      const statsRes = await adminApi.getStats()
      setStats(statsRes.stats)

      if (activeTab === 'users') {
        const usersRes = await adminApi.getUsers()
        setUsers(usersRes.users)
      } else if (activeTab === 'licenses') {
        const licensesRes = await adminApi.getLicenses()
        setLicenses(licensesRes.licenses)
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authorized) {
      fetchAdminData()
    }
  }, [activeTab, authorized])

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-orange-600 mb-4" />
          <p className="text-gray-600">Verifying authorization...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-1">System management and configuration</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('token')
              localStorage.removeItem('user')
              router.push('/login')
            }}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <TabButton
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            icon={<BarChart3 className="w-4 h-4 mr-2" />}
            label="Overview"
          />
          <TabButton
            active={activeTab === 'users'}
            onClick={() => setActiveTab('users')}
            icon={<Users className="w-4 h-4 mr-2" />}
            label="Users"
          />
          <TabButton
            active={activeTab === 'licenses'}
            onClick={() => setActiveTab('licenses')}
            icon={<Key className="w-4 h-4 mr-2" />}
            label="Licenses"
          />
          <TabButton
            active={activeTab === 'factories'}
            onClick={() => setActiveTab('factories')}
            icon={<Factory className="w-4 h-4 mr-2" />}
            label="Factories"
          />
          <TabButton
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
            icon={<Settings className="w-4 h-4 mr-2" />}
            label="Settings"
          />
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab stats={stats} loading={loading} />}
      {activeTab === 'users' && <UsersTab users={users} loading={loading} />}
      {activeTab === 'licenses' && <LicensesTab licenses={licenses} loading={loading} />}
      {activeTab === 'factories' && <FactoriesTab />}
      {activeTab === 'settings' && <SettingsTab />}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
        active
          ? 'border-orange-500 text-orange-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function OverviewTab({ stats, loading }: { stats: any; loading: boolean }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Users className="w-6 h-6" />}
          title="Total Users"
          value={stats.totalUsers}
          color="blue"
          loading={loading}
        />
        <StatCard
          icon={<Key className="w-6 h-6" />}
          title="Active Licenses"
          value={stats.activeLicenses}
          color="green"
          loading={loading}
        />
        <StatCard
          icon={<Factory className="w-6 h-6" />}
          title="Total Factories"
          value={stats.totalFactories}
          color="orange"
          loading={loading}
        />
        <StatCard
          icon={<BarChart3 className="w-6 h-6" />}
          title="System Health"
          value={stats.systemHealth}
          color="purple"
          loading={loading}
        />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Status</h2>
        <div className="space-y-4">
          <StatusItem label="API Server" status="operational" />
          <StatusItem label="Database" status="operational" />
          <StatusItem label="Cloud Sync" status="operational" />
          <StatusItem label="Authentication" status="operational" />
        </div>
      </div>
    </div>
  )
}

function UsersTab({ users, loading }: { users: any[]; loading: boolean }) {
  const [actionLoading, setActionLoading] = useState<{ [key: number]: boolean }>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleUserAction = async (userId: number, action: string, actionName: string) => {
    setActionLoading({ ...actionLoading, [userId]: true })
    setMessage(null)

    try {
      let result: { success: boolean; message?: string } | undefined
      switch (action) {
        case 'activate':
          result = await adminApi.activateUser(userId)
          break
        case 'deactivate':
          result = await adminApi.deactivateUser(userId)
          break
        case 'ban':
          result = await adminApi.banUser(userId)
          break
        case 'delete':
          result = await adminApi.deleteUser(userId)
          break
      }

      if (result?.success) {
        setMessage({ type: 'success', text: result.message || `${actionName} successful` })
        // Refresh the users list
        setTimeout(() => window.location.reload(), 1000)
      } else {
        setMessage({ type: 'error', text: result?.message || `${actionName} failed` })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || `${actionName} failed` })
    } finally {
      setActionLoading({ ...actionLoading, [userId]: false })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
        <button className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700">
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500 italic">
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500 italic">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onAction={handleUserAction}
                  actionLoading={actionLoading[user.id] || false}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LicensesTab({ licenses, loading }: { licenses: any[]; loading: boolean }) {
  const [actionLoading, setActionLoading] = useState<{ [key: number]: boolean }>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleLicenseAction = async (licenseId: number, action: string, actionName: string) => {
    setActionLoading({ ...actionLoading, [licenseId]: true })
    setMessage(null)

    try {
      let result: { success: boolean; message?: string } | undefined
      switch (action) {
        case 'activate':
          result = await adminApi.activateLicense(licenseId)
          break
        case 'deactivate':
          result = await adminApi.deactivateLicense(licenseId)
          break
        case 'ban':
          result = await adminApi.banLicense(licenseId)
          break
        case 'delete':
          result = await adminApi.deleteLicense(licenseId)
          break
      }

      if (result?.success) {
        setMessage({ type: 'success', text: result.message || `${actionName} successful` })
        // Refresh licenses list
        setTimeout(() => window.location.reload(), 1000)
      } else {
        setMessage({ type: 'error', text: result?.message || `${actionName} failed` })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || `${actionName} failed` })
    } finally {
      setActionLoading({ ...actionLoading, [licenseId]: false })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">License Management</h2>
        <button className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700">
          <Plus className="w-4 h-4 mr-2" />
          Generate License
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                License Key
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Factory
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expiry
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500 italic">
                  Loading licenses...
                </td>
              </tr>
            ) : licenses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500 italic">
                  No licenses found
                </td>
              </tr>
            ) : (
              licenses.map((license) => (
                <LicenseRow
                  key={license.id}
                  license={license}
                  onAction={handleLicenseAction}
                  actionLoading={actionLoading[license.id] || false}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FactoriesTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Factory Management</h2>
        <button className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Factory
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FactoryCard name="Factory A" location="Cairo, Egypt" status="active" />
        <FactoryCard name="Factory B" location="Alexandria, Egypt" status="active" />
        <FactoryCard name="Factory C" location="Giza, Egypt" status="inactive" />
      </div>
    </div>
  )
}

function SettingsTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">System Settings</h2>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <SettingSection title="General Settings">
          <SettingItem label="Application Name" value="Dates Factory Manager" />
          <SettingItem label="Support Email" value="support@datesfactory.com" />
        </SettingSection>

        <SettingSection title="Security Settings">
          <SettingItem label="Session Timeout" value="30 minutes" />
          <SettingItem label="Password Policy" value="Minimum 6 characters" />
        </SettingSection>

        <SettingSection title="Database Settings">
          <SettingItem label="Connection Pool" value="10 connections" />
          <SettingItem label="Backup Frequency" value="Daily" />
        </SettingSection>
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
  value: any
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
          <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '...' : value}</p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function StatusItem({ label, status }: { label: string; status: string }) {
  const statusColors = {
    operational: 'bg-green-100 text-green-800',
    degraded: 'bg-yellow-100 text-yellow-800',
    down: 'bg-red-100 text-red-800'
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm font-medium text-gray-900">{label}</span>
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}
      >
        {status}
      </span>
    </div>
  )
}

function UserRow({
  user,
  onAction,
  actionLoading
}: {
  user: any
  onAction: (userId: number, action: string, actionName: string) => void
  actionLoading: boolean
}) {
  const statusColors: { [key: string]: string } = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-yellow-100 text-yellow-800',
    banned: 'bg-red-100 text-red-800'
  }

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-gray-900">{user.full_name || 'No Name'}</div>
          <div className="text-sm text-gray-500">{user.phone}</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}
        >
          {user.role}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[user.status] || 'bg-gray-100 text-gray-800'}`}
        >
          {user.status || 'active'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
        {user.status !== 'active' && (
          <button
            onClick={() => onAction(user.id, 'activate', 'Activate')}
            disabled={actionLoading}
            className="text-green-600 hover:text-green-900 disabled:opacity-50"
            title="Activate"
          >
            <CheckCircle className="w-4 h-4 inline" />
          </button>
        )}
        {user.status !== 'inactive' && (
          <button
            onClick={() => onAction(user.id, 'deactivate', 'Deactivate')}
            disabled={actionLoading}
            className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
            title="Deactivate"
          >
            <Power className="w-4 h-4 inline" />
          </button>
        )}
        {user.status !== 'banned' && (
          <button
            onClick={() => onAction(user.id, 'ban', 'Ban')}
            disabled={actionLoading}
            className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
            title="Ban"
          >
            <Ban className="w-4 h-4 inline" />
          </button>
        )}
        <button
          onClick={() => onAction(user.id, 'delete', 'Delete')}
          disabled={actionLoading}
          className="text-red-600 hover:text-red-900 disabled:opacity-50"
          title="Delete"
        >
          <Trash2 className="w-4 h-4 inline" />
        </button>
      </td>
    </tr>
  )
}

function LicenseRow({
  license,
  onAction,
  actionLoading
}: {
  license: any
  onAction: (licenseId: number, action: string, actionName: string) => void
  actionLoading: boolean
}) {
  const statusColors: { [key: string]: string } = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-yellow-100 text-yellow-800',
    banned: 'bg-red-100 text-red-800',
    expired: 'bg-red-100 text-red-800'
  }

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
        {license.license_key}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {license.factory_name || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[license.status] || 'bg-gray-100 text-gray-800'}`}
        >
          {license.status || 'active'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {license.expiry_date ? new Date(license.expiry_date).toLocaleDateString() : 'Never'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
        {license.status !== 'active' && license.status !== 'expired' && (
          <button
            onClick={() => onAction(license.id, 'activate', 'Activate')}
            disabled={actionLoading}
            className="text-green-600 hover:text-green-900 disabled:opacity-50"
            title="Activate"
          >
            <CheckCircle className="w-4 h-4 inline" />
          </button>
        )}
        {license.status !== 'inactive' && license.status !== 'expired' && (
          <button
            onClick={() => onAction(license.id, 'deactivate', 'Deactivate')}
            disabled={actionLoading}
            className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
            title="Deactivate"
          >
            <Power className="w-4 h-4 inline" />
          </button>
        )}
        {license.status !== 'banned' && license.status !== 'expired' && (
          <button
            onClick={() => onAction(license.id, 'ban', 'Ban')}
            disabled={actionLoading}
            className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
            title="Ban"
          >
            <Ban className="w-4 h-4 inline" />
          </button>
        )}
        <button
          onClick={() => onAction(license.id, 'delete', 'Delete')}
          disabled={actionLoading}
          className="text-red-600 hover:text-red-900 disabled:opacity-50"
          title="Delete"
        >
          <Trash2 className="w-4 h-4 inline" />
        </button>
      </td>
    </tr>
  )
}

function FactoryCard({
  name,
  location,
  status
}: {
  name: string
  location: string
  status: string
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
          <p className="text-sm text-gray-600">{location}</p>
        </div>
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {status}
        </span>
      </div>
      <div className="flex justify-end space-x-2">
        <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">
          View Details
        </button>
        <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">
          Edit
        </button>
      </div>
    </div>
  )
}

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function SettingItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  )
}
