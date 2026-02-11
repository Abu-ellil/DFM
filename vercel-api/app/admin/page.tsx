'use client'

import { useState, useEffect, useCallback } from 'react'
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
  CheckCircle,
  Lock,
  Database
} from 'lucide-react'
import { adminApi } from '../../lib/api'

export default function AdminPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  // Data states
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeLicenses: 0,
    totalFactories: 0,
    systemHealth: 'good'
  })
  const [users, setUsers] = useState<any[]>([])
  const [licenses, setLicenses] = useState<any[]>([])
  const [factories, setFactories] = useState<any[]>([])
  const [settings, setSettings] = useState<any>(null)

  const fetchAdminData = useCallback(async () => {
    setLoading(true)
    try {
      const statsRes = await adminApi.getStats()
      setStats(statsRes.stats)

      if (activeTab === 'users') {
        const res = await adminApi.getUsers()
        setUsers(res.users)
      } else if (activeTab === 'licenses') {
        const res = await adminApi.getLicenses()
        setLicenses(res.licenses)
      } else if (activeTab === 'factories') {
        const res = await adminApi.getFactories()
        setFactories(res.factories)
      } else if (activeTab === 'settings') {
        const res = await adminApi.getSettings()
        setSettings(res.settings)
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
  }, [activeTab, router])

  const checkAuth = useCallback(() => {
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
  }, [router, fetchAdminData])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (authorized) {
      fetchAdminData()
    }
  }, [activeTab, authorized, fetchAdminData])

  const handleRefresh = () => {
    fetchAdminData()
  }

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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col shadow-xl">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">DFM Admin</h2>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                Management Panel
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <SidebarLink
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            icon={<BarChart3 className="w-5 h-5" />}
            label="Overview"
          />
          <SidebarLink
            active={activeTab === 'users'}
            onClick={() => setActiveTab('users')}
            icon={<Users className="w-5 h-5" />}
            label="User Management"
          />
          <SidebarLink
            active={activeTab === 'licenses'}
            onClick={() => setActiveTab('licenses')}
            icon={<Key className="w-5 h-5" />}
            label="License Keys"
          />
          <SidebarLink
            active={activeTab === 'factories'}
            onClick={() => setActiveTab('factories')}
            icon={<Factory className="w-5 h-5" />}
            label="Factories"
          />
          <SidebarLink
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
            icon={<Settings className="w-5 h-5" />}
            label="System Settings"
          />
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            onClick={() => {
              localStorage.removeItem('token')
              localStorage.removeItem('user')
              router.push('/login')
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all group"
          >
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-gray-900 capitalize">
              {activeTab.replace('-', ' ')}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Control and monitor your system performance
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchAdminData}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-all disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900">Administrator</p>
                <p className="text-[10px] text-gray-500 font-medium">System Owner</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-slate-500">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 max-w-6xl mx-auto w-full">
          {activeTab === 'overview' && <OverviewTab stats={stats} loading={loading} />}
          {activeTab === 'users' && (
            <UsersTab users={users} loading={loading} onRefresh={handleRefresh} />
          )}
          {activeTab === 'licenses' && (
            <LicensesTab licenses={licenses} loading={loading} onRefresh={handleRefresh} />
          )}
          {activeTab === 'factories' && (
            <FactoriesTab factories={factories} loading={loading} onRefresh={handleRefresh} />
          )}
          {activeTab === 'settings' && (
            <SettingsTab settings={settings} loading={loading} onRefresh={handleRefresh} />
          )}
        </div>
      </main>
    </div>
  )
}

function SidebarLink({
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
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
        active
          ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      <span className={`${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>
        {icon}
      </span>
      <span className="font-medium text-sm tracking-wide">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>}
    </button>
  )
}

function OverviewTab({ stats, loading }: { stats: any; loading: boolean }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-900">System Performance</h2>
            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest bg-orange-50 px-2 py-1 rounded-md">
              Real-time
            </span>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <StatusItem
                label="API Server"
                status="operational"
                description="Primary backend services"
              />
              <StatusItem
                label="Neon Database"
                status="operational"
                description="PostgreSQL persistence layer"
              />
              <StatusItem
                label="Vercel Edge"
                status="operational"
                description="API routing and static delivery"
              />
              <StatusItem
                label="License Service"
                status="operational"
                description="Key generation and validation"
              />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Settings className="w-32 h-32 rotate-12" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Admin Quick Actions</h3>
            <p className="text-slate-400 text-sm mb-8">
              Frequent operations for system maintenance
            </p>
          </div>
          <div className="space-y-3 relative z-10">
            <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-semibold transition-all flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4" />
              <span>Clear System Cache</span>
            </button>
            <button className="w-full py-3 bg-orange-500 hover:bg-orange-600 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-orange-500/20">
              Generate System Report
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function UsersTab({
  users,
  loading,
  onRefresh
}: {
  users: any[]
  loading: boolean
  onRefresh: () => void
}) {
  const [actionLoading, setActionLoading] = useState<{ [key: string | number]: boolean }>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)

  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    full_name: '',
    factory_name: '',
    role: 'user' as const
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.factory_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter

    return matchesSearch && matchesRole && matchesStatus
  })

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)
    try {
      const res = await adminApi.createUser(formData)
      if (res.success) {
        setMessage({ type: 'success', text: 'Identity successfully enrolled in registry' })
        setShowAddModal(false)
        setFormData({ phone: '', password: '', full_name: '', factory_name: '', role: 'user' })
        onRefresh()
      } else {
        setMessage({ type: 'error', text: res.message || 'Enrollment failed' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Creation failed' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    setIsSubmitting(true)
    setMessage(null)
    try {
      const updateData: any = { ...formData }
      if (!updateData.password) delete updateData.password
      const res = await adminApi.updateUser(editingUser.id, updateData)
      if (res.success) {
        setMessage({ type: 'success', text: 'Identity profile successfully updated' })
        setShowEditModal(false)
        setEditingUser(null)
        onRefresh()
      } else {
        setMessage({ type: 'error', text: res.message || 'Update failed' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Update failed' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditModal = (user: any) => {
    setEditingUser(user)
    setFormData({
      phone: user.phone || '',
      password: '',
      full_name: user.full_name || '',
      factory_name: user.factory_name || '',
      role: (user.role as any) || 'user'
    })
    setShowEditModal(true)
  }

  const handleUserAction = async (userId: number | string, action: string, actionName: string) => {
    setActionLoading({ ...actionLoading, [userId]: true })
    try {
      let result: any
      if (action === 'activate') result = await adminApi.activateUser(userId)
      else if (action === 'deactivate') result = await adminApi.deactivateUser(userId)
      else if (action === 'ban') result = await adminApi.banUser(userId)
      else if (action === 'delete') result = await adminApi.deleteUser(userId)

      if (result?.success) {
        setMessage({ type: 'success', text: `${actionName} operation completed` })
        onRefresh()
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || `${actionName} failed` })
    } finally {
      setActionLoading({ ...actionLoading, [userId]: false })
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Identity Registry</h2>
          <p className="text-sm text-gray-500">Manage system access and personnel permissions</p>
        </div>
        <button
          onClick={() => {
            setFormData({ phone: '', password: '', full_name: '', factory_name: '', role: 'user' })
            setShowAddModal(true)
          }}
          className="flex items-center justify-center px-6 py-3 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 active:scale-95"
        >
          <Plus className="w-5 h-5 mr-2" />
          Enroll New Identity
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Search Directory
          </label>
          <input
            type="text"
            placeholder="Search phone, name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Access Level
          </label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 transition-all"
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrator</option>
            <option value="manager">Manager</option>
            <option value="user">Standard User</option>
            <option value="worker">Field Worker</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 transition-all"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Suspended</option>
            <option value="banned">Restricted</option>
          </select>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center space-x-3 animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}
        >
          <div
            className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}
          />
          <p className="text-sm font-bold">{message.text}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Identity Profile
                </th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Permission
                </th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-8 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-8 py-12 text-center text-gray-400 italic font-medium"
                  >
                    Synchronizing directory...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-8 py-12 text-center text-gray-400 italic font-medium"
                  >
                    No matching identities found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onEdit={() => openEditModal(user)}
                    onAction={handleUserAction}
                    actionLoading={actionLoading[user.id] || false}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => {
              setShowAddModal(false)
              setShowEditModal(false)
            }}
          ></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">
                {showAddModal ? 'New Identity' : 'Modify Identity'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setShowEditModal(false)
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Plus className="w-5 h-5 rotate-45 text-gray-400" />
              </button>
            </div>
            <form
              onSubmit={showAddModal ? handleAddUser : handleEditUser}
              className="p-8 space-y-5"
            >
              <div className="space-y-4">
                <InputField
                  label="Full Legal Name"
                  value={formData.full_name}
                  onChange={(v: string) => setFormData({ ...formData, full_name: v })}
                  placeholder="e.g. John Doe"
                  required
                />
                <InputField
                  label="Contact Number"
                  value={formData.phone}
                  onChange={(v: string) => setFormData({ ...formData, phone: v })}
                  placeholder="0123456789"
                  required
                />
                <InputField
                  label={showEditModal ? 'Update Password (optional)' : 'Access Password'}
                  value={formData.password}
                  onChange={(v: string) => setFormData({ ...formData, password: v })}
                  type="password"
                  required={showAddModal}
                />
                <InputField
                  label="Factory Affiliation"
                  value={formData.factory_name}
                  onChange={(v: string) => setFormData({ ...formData, factory_name: v })}
                  placeholder="Assigned Factory"
                />
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Access Permission
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 transition-all"
                  >
                    <option value="user">Standard User</option>
                    <option value="manager">Manager</option>
                    <option value="worker">Field Worker</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setShowEditModal(false)
                  }}
                  className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-2 py-3 px-8 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'Processing...'
                    : showAddModal
                      ? 'Enroll Identity'
                      : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function InputField({ label, value, onChange, type = 'text', placeholder, required = false }: any) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
        {label}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-300"
      />
    </div>
  )
}

function LicensesTab({
  licenses,
  loading,
  onRefresh
}: {
  licenses: any[]
  loading: boolean
  onRefresh: () => void
}) {
  const [actionLoading, setActionLoading] = useState<{ [key: string | number]: boolean }>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingLicense, setEditingLicense] = useState<any>(null)

  const [formData, setFormData] = useState({
    factoryName: '',
    durationCode: 'MONTH_1',
    machineId: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const filteredLicenses = licenses.filter((license) => {
    const matchesSearch =
      license.license_key?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.factory_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.machine_id?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || license.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleGenerateLicense = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)
    try {
      const res = await adminApi.generateLicense({
        factory_name: formData.factoryName,
        duration_code: formData.durationCode,
        machine_id: formData.machineId
      })
      if (res.success) {
        setMessage({ type: 'success', text: 'License generated successfully' })
        setShowAddModal(false)
        setFormData({ factoryName: '', durationCode: 'MONTH_1', machineId: '' })
        onRefresh()
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to generate license' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Generation failed' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditLicense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLicense) return
    setIsSubmitting(true)
    setMessage(null)
    try {
      const res = await adminApi.updateLicense(editingLicense.id, {
        factory_name: formData.factoryName,
        machine_id: formData.machineId
      })
      if (res.success) {
        setMessage({ type: 'success', text: 'License updated successfully' })
        setShowEditModal(false)
        setEditingLicense(null)
        onRefresh()
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to update license' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Update failed' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditModal = (license: any) => {
    setEditingLicense(license)
    setFormData({
      factoryName: license.factory_name || '',
      durationCode: 'MONTH_1',
      machineId: license.machine_id || ''
    })
    setShowEditModal(true)
  }

  const handleLicenseAction = async (
    licenseId: number | string,
    action: string,
    actionName: string
  ) => {
    setActionLoading({ ...actionLoading, [licenseId]: true })
    try {
      let result: any
      if (action === 'activate') result = await adminApi.activateLicense(licenseId)
      else if (action === 'deactivate') result = await adminApi.deactivateLicense(licenseId)
      else if (action === 'ban') result = await adminApi.banLicense(licenseId)
      else if (action === 'delete') result = await adminApi.deleteLicense(licenseId)

      if (result?.success) {
        setMessage({ type: 'success', text: `${actionName} successful` })
        onRefresh()
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || `${actionName} failed` })
    } finally {
      setActionLoading({ ...actionLoading, [licenseId]: false })
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">License Management</h2>
          <p className="text-sm text-gray-500">Control system access keys and validity</p>
        </div>
        <button
          onClick={() => {
            setFormData({ factoryName: '', durationCode: 'MONTH_1', machineId: '' })
            setShowAddModal(true)
          }}
          className="flex items-center justify-center px-6 py-3 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 active:scale-95"
        >
          <Plus className="w-5 h-5 mr-2" />
          Generate New Key
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Search Registry
          </label>
          <input
            type="text"
            placeholder="Search key, factory, machine..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Key Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 transition-all"
          >
            <option value="all">All Keys</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="expired">Expired Only</option>
            <option value="banned">Banned Only</option>
          </select>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center space-x-3 ${message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}
        >
          <p className="text-sm font-bold">{message.text}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  License Key
                </th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Affiliation
                </th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-8 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-8 py-12 text-center text-gray-400 italic font-medium"
                  >
                    Loading secure registry...
                  </td>
                </tr>
              ) : filteredLicenses.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-8 py-12 text-center text-gray-400 italic font-medium"
                  >
                    No licenses matching filters
                  </td>
                </tr>
              ) : (
                filteredLicenses.map((license) => (
                  <LicenseRow
                    key={license.id}
                    license={license}
                    onEdit={() => openEditModal(license)}
                    onAction={handleLicenseAction}
                    actionLoading={actionLoading[license.id] || false}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => {
              setShowAddModal(false)
              setShowEditModal(false)
            }}
          ></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">
                {showAddModal ? 'Generate Key' : 'Modify Key'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setShowEditModal(false)
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Plus className="w-5 h-5 rotate-45 text-gray-400" />
              </button>
            </div>
            <form
              onSubmit={showAddModal ? handleGenerateLicense : handleEditLicense}
              className="p-8 space-y-5"
            >
              <div className="space-y-4">
                <InputField
                  label="Factory Name"
                  value={formData.factoryName}
                  onChange={(v: string) => setFormData({ ...formData, factoryName: v })}
                  placeholder="Target Factory"
                  required
                />
                <InputField
                  label="Machine ID (Optional)"
                  value={formData.machineId}
                  onChange={(v: string) => setFormData({ ...formData, machineId: v })}
                  placeholder="Hardware Identifier"
                />
                {showAddModal && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Duration Period
                    </label>
                    <select
                      value={formData.durationCode}
                      onChange={(e) => setFormData({ ...formData, durationCode: e.target.value })}
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 transition-all"
                    >
                      <option value="MONTH_1">1 Month Access</option>
                      <option value="MONTH_3">3 Months Access</option>
                      <option value="MONTH_6">6 Months Access</option>
                      <option value="YEAR_1">1 Year Access</option>
                      <option value="LIFETIME">Unlimited Access</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setShowEditModal(false)
                  }}
                  className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-2 py-3 px-8 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : showAddModal ? 'Generate Key' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function FactoriesTab({
  factories,
  loading,
  onRefresh
}: {
  factories: any[]
  loading: boolean
  onRefresh: () => void
}) {
  const [actionLoading, setActionLoading] = useState<{ [key: string | number]: boolean }>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingFactory, setEditingFactory] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    status: 'active' as const
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredFactories = factories.filter((factory) => {
    const matchesSearch =
      factory.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      factory.location?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || factory.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleAddFactory = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const res = await adminApi.createFactory(formData)
      if (res.success) {
        setMessage({ type: 'success', text: 'New factory facility added successfully' })
        setShowAddModal(false)
        setFormData({ name: '', location: '', status: 'active' })
        onRefresh()
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to add factory' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Addition failed' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditFactory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingFactory) return
    setIsSubmitting(true)
    setMessage(null)

    try {
      const res = await adminApi.updateFactory(editingFactory.id, formData)
      if (res.success) {
        setMessage({ type: 'success', text: 'Factory facility updated successfully' })
        setShowEditModal(false)
        setEditingFactory(null)
        setFormData({ name: '', location: '', status: 'active' })
        onRefresh()
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to update factory' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Update failed' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditModal = (factory: any) => {
    setEditingFactory(factory)
    setFormData({
      name: factory.name,
      location: factory.location || '',
      status: factory.status || 'active'
    })
    setShowEditModal(true)
  }

  const handleDelete = async (id: number | string) => {
    if (!confirm('Permanently decommission and delete this factory facility?')) return

    setActionLoading({ ...actionLoading, [id]: true })
    try {
      const res = await adminApi.deleteFactory(id)
      if (res.success) {
        setMessage({ type: 'success', text: 'Factory facility decommissioned' })
        onRefresh()
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to delete' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Delete failed' })
    } finally {
      setActionLoading({ ...actionLoading, [id]: false })
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Facility Management</h2>
          <p className="text-sm text-gray-500">Oversee production sites and operational units</p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: '', location: '', status: 'active' })
            setShowAddModal(true)
          }}
          className="flex items-center justify-center px-6 py-3 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 active:scale-95"
        >
          <Plus className="w-5 h-5 mr-2" />
          Register New Facility
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Search Facilities
          </label>
          <input
            type="text"
            placeholder="Search name, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Operational Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 transition-all"
          >
            <option value="all">All Facilities</option>
            <option value="active">Active Facilities</option>
            <option value="inactive">Inactive Facilities</option>
          </select>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center space-x-3 animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}
        >
          <div
            className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}
          />
          <p className="text-sm font-bold">{message.text}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
          <RefreshCw className="w-10 h-10 animate-spin mx-auto text-orange-200 mb-4" />
          <p className="text-gray-400 font-medium italic">Synchronizing facility data...</p>
        </div>
      ) : filteredFactories.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
          <Factory className="w-16 h-16 mx-auto text-gray-100 mb-4" />
          <p className="text-gray-400 font-medium italic">No facilities matching criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFactories.map((factory) => (
            <FactoryCard
              key={factory.id}
              factory={factory}
              onEdit={() => openEditModal(factory)}
              onDelete={() => handleDelete(factory.id)}
              loading={actionLoading[factory.id] || false}
            />
          ))}
        </div>
      )}

      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => {
              setShowAddModal(false)
              setShowEditModal(false)
            }}
          ></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">
                {showAddModal ? 'New Facility' : 'Modify Facility'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setShowEditModal(false)
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Plus className="w-5 h-5 rotate-45 text-gray-400" />
              </button>
            </div>
            <form
              onSubmit={showAddModal ? handleAddFactory : handleEditFactory}
              className="p-8 space-y-5"
            >
              <div className="space-y-4">
                <InputField
                  label="Facility Name"
                  value={formData.name}
                  onChange={(v: string) => setFormData({ ...formData, name: v })}
                  placeholder="e.g. Cairo Central Unit"
                  required
                />
                <InputField
                  label="Geographic Location"
                  value={formData.location}
                  onChange={(v: string) => setFormData({ ...formData, location: v })}
                  placeholder="City, Region"
                />
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Operational Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 transition-all"
                  >
                    <option value="active">Active & Operational</option>
                    <option value="inactive">Inactive / Maintenance</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setShowEditModal(false)
                  }}
                  className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-2 py-3 px-8 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'Processing...'
                    : showAddModal
                      ? 'Register Facility'
                      : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function SettingsTab({
  settings,
  loading,
  onRefresh
}: {
  settings: any
  loading: boolean
  onRefresh: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleUpdate = async (key: string, value: any) => {
    setSaving(true)
    setMessage(null)
    try {
      const updatedSettings = { ...settings, [key]: value }
      const res = await adminApi.updateSettings(updatedSettings)
      if (res.success) {
        setMessage({ type: 'success', text: 'System configuration updated' })
        onRefresh()
      } else {
        setMessage({ type: 'error', text: res.message || 'Update failed' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Update failed' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 animate-in fade-in duration-500">
        <RefreshCw className="w-10 h-10 animate-spin mx-auto text-orange-200 mb-4" />
        <p className="text-gray-400 font-medium italic">Synchronizing system settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">System Configuration</h2>
          <p className="text-sm text-gray-500">
            Global environment variables and application logic
          </p>
        </div>
        {saving && (
          <div className="flex items-center px-4 py-2 bg-orange-50 text-orange-600 rounded-xl text-xs font-bold border border-orange-100 animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin mr-2" />
            Persisting Changes...
          </div>
        )}
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center space-x-3 animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}
        >
          <div
            className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}
          />
          <p className="text-sm font-bold">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-8">
          <SettingSection title="Identity & Branding" icon={<Settings className="w-4 h-4" />}>
            <SettingItem
              label="Application Name"
              value={settings?.appName || 'Dates Factory Manager'}
              onUpdate={(val) => handleUpdate('appName', val)}
              validation={(val) => (val.length < 3 ? 'Name too short' : null)}
            />
            <SettingItem
              label="Support Protocol Email"
              value={settings?.supportEmail || 'support@datesfactory.com'}
              onUpdate={(val) => handleUpdate('supportEmail', val)}
              validation={(val) =>
                !val.includes('@') || !val.includes('.') ? 'Invalid email' : null
              }
            />
            <SettingItem
              label="Emergency Maintenance Mode"
              value={settings?.maintenanceMode || false}
              type="toggle"
              onUpdate={(val) => handleUpdate('maintenanceMode', val)}
            />
          </SettingSection>

          <SettingSection title="User Protocols" icon={<Users className="w-4 h-4" />}>
            <SettingItem
              label="Public Registration"
              value={settings?.allowRegistration ?? true}
              type="toggle"
              onUpdate={(val) => handleUpdate('allowRegistration', val)}
            />
            <SettingItem
              label="Default Access Level"
              value={settings?.defaultUserRole || 'user'}
              type="select"
              options={[
                { label: 'Standard User', value: 'user' },
                { label: 'Factory Worker', value: 'worker' },
                { label: 'Plant Manager', value: 'manager' }
              ]}
              onUpdate={(val) => handleUpdate('defaultUserRole', val)}
            />
            <SettingItem
              label="Security Policy Label"
              value={settings?.passwordPolicy || 'Minimum 6 characters'}
              onUpdate={(val) => handleUpdate('passwordPolicy', val)}
            />
          </SettingSection>
        </div>

        <div className="space-y-8">
          <SettingSection title="Session & Security" icon={<Lock className="w-4 h-4" />}>
            <SettingItem
              label="Token Expiration"
              value={settings?.sessionTimeout || '30 minutes'}
              type="select"
              options={[
                { label: '15 Minutes', value: '15 minutes' },
                { label: '30 Minutes', value: '30 minutes' },
                { label: '1 Hour', value: '1 hour' },
                { label: '4 Hours', value: '4 hours' },
                { label: '8 Hours', value: '8 hours' }
              ]}
              onUpdate={(val) => handleUpdate('sessionTimeout', val)}
            />
          </SettingSection>

          <SettingSection title="Infrastructure & Ops" icon={<Database className="w-4 h-4" />}>
            <SettingItem
              label="Neon Connection Pool"
              value={settings?.connectionPool || 10}
              type="number"
              onUpdate={(val) => handleUpdate('connectionPool', parseInt(val))}
              validation={(val) =>
                parseInt(val) < 1 || parseInt(val) > 100 ? 'Range: 1-100' : null
              }
            />
            <SettingItem
              label="Automated Backup Cadence"
              value={settings?.backupFrequency || 'Daily'}
              type="select"
              options={[
                { label: 'Every Hour', value: 'Hourly' },
                { label: 'Once Daily', value: 'Daily' },
                { label: 'Every Week', value: 'Weekly' }
              ]}
              onUpdate={(val) => handleUpdate('backupFrequency', val)}
            />
          </SettingSection>
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
  value: any
  color: string
  loading: boolean
}) {
  const colorClasses: { [key: string]: string } = {
    blue: 'bg-blue-50 text-blue-500 border-blue-100',
    green: 'bg-green-50 text-green-500 border-green-100',
    orange: 'bg-orange-50 text-orange-500 border-orange-100',
    purple: 'bg-purple-50 text-purple-500 border-purple-100'
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center space-x-5 hover:shadow-md transition-all group">
      <div
        className={`p-4 rounded-xl border transition-all group-hover:scale-110 ${colorClasses[color] || 'bg-gray-50 text-gray-500 border-gray-100'}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-black text-gray-900 mt-0.5 tracking-tight">
          {loading ? (
            <span className="inline-block w-8 h-6 bg-gray-100 animate-pulse rounded"></span>
          ) : (
            value
          )}
        </p>
      </div>
    </div>
  )
}

function StatusItem({
  label,
  status,
  description
}: {
  label: string
  status: string
  description?: string
}) {
  const statusColors: { [key: string]: string } = {
    operational: 'text-green-500 bg-green-50 border-green-100',
    degraded: 'text-yellow-500 bg-yellow-50 border-yellow-100',
    down: 'text-red-500 bg-red-50 border-red-100'
  }

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-50 hover:border-gray-100 transition-colors bg-white shadow-sm">
      <div className="flex items-center space-x-4">
        <div
          className={`w-2 h-2 rounded-full animate-pulse ${status === 'operational' ? 'bg-green-500' : status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'}`}
        ></div>
        <div>
          <p className="text-sm font-bold text-gray-900">{label}</p>
          {description && <p className="text-[11px] text-gray-400 font-medium">{description}</p>}
        </div>
      </div>
      <span
        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[status] || 'text-gray-500 bg-gray-50 border-gray-100'}`}
      >
        {status}
      </span>
    </div>
  )
}

function UserRow({
  user,
  onEdit,
  onAction,
  actionLoading
}: {
  user: any
  onEdit: () => void
  onAction: (userId: number | string, action: string, actionName: string) => void
  actionLoading: boolean
}) {
  const statusColors: { [key: string]: string } = {
    active: 'text-green-600 bg-green-50 border-green-100',
    inactive: 'text-yellow-600 bg-yellow-50 border-yellow-100',
    banned: 'text-red-600 bg-red-50 border-red-100'
  }

  const roleColors: { [key: string]: string } = {
    admin: 'text-purple-600 bg-purple-50 border-purple-100',
    manager: 'text-blue-600 bg-blue-50 border-blue-100',
    worker: 'text-slate-600 bg-slate-50 border-slate-100',
    user: 'text-gray-600 bg-gray-50 border-gray-100'
  }

  return (
    <tr className="group hover:bg-gray-50/50 transition-colors">
      <td className="px-8 py-5">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs border-2 border-white shadow-sm">
            {user.full_name?.substring(0, 2).toUpperCase() || '??'}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-none mb-1">
              {user.full_name || 'Anonymous User'}
            </p>
            <p className="text-[11px] font-medium text-gray-400 font-mono tracking-tight">
              {user.phone}
            </p>
          </div>
        </div>
      </td>
      <td className="px-8 py-5">
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${roleColors[user.role] || roleColors.user}`}
        >
          {user.role}
        </span>
      </td>
      <td className="px-8 py-5">
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[user.status] || 'text-gray-400 bg-gray-50 border-gray-100'}`}
        >
          {user.status || 'active'}
        </span>
      </td>
      <td className="px-8 py-5">
        <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
            title="Edit Details"
          >
            <Edit className="w-4 h-4" />
          </button>

          {user.status !== 'active' && (
            <button
              onClick={() => onAction(user.id, 'activate', 'Activation')}
              disabled={actionLoading}
              className="p-2 text-slate-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-all disabled:opacity-30"
              title="Grant Access"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}

          {user.status !== 'inactive' && (
            <button
              onClick={() => onAction(user.id, 'deactivate', 'Deactivation')}
              disabled={actionLoading}
              className="p-2 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all disabled:opacity-30"
              title="Suspend Access"
            >
              <Power className="w-4 h-4" />
            </button>
          )}

          {user.status !== 'banned' && (
            <button
              onClick={() => onAction(user.id, 'ban', 'Banning')}
              disabled={actionLoading}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-30"
              title="Restrict User"
            >
              <Ban className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => {
              if (confirm('Permanently remove this user identity? This cannot be undone.')) {
                onAction(user.id, 'delete', 'Deletion')
              }
            }}
            disabled={actionLoading}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-30"
            title="Terminate Account"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

function LicenseRow({
  license,
  onEdit,
  onAction,
  actionLoading
}: {
  license: any
  onEdit: () => void
  onAction: (licenseId: number | string, action: string, actionName: string) => void
  actionLoading: boolean
}) {
  const statusColors: { [key: string]: string } = {
    active: 'text-green-600 bg-green-50 border-green-100',
    inactive: 'text-yellow-600 bg-yellow-50 border-yellow-100',
    expired: 'text-red-600 bg-red-50 border-red-100',
    banned: 'text-slate-600 bg-slate-50 border-slate-100'
  }

  return (
    <tr className="group hover:bg-gray-50/50 transition-colors">
      <td className="px-8 py-5">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
            <Key className="w-4 h-4" />
          </div>
          <p className="text-sm font-mono font-bold text-gray-900 tracking-tighter">
            {license.license_key}
          </p>
        </div>
      </td>
      <td className="px-8 py-5">
        <div>
          <p className="text-sm font-bold text-gray-900">
            {license.factory_name || 'General Access'}
          </p>
          <p className="text-[10px] font-medium text-gray-400 font-mono">
            {license.machine_id || 'ANY_HARDWARE'}
          </p>
        </div>
      </td>
      <td className="px-8 py-5">
        <div className="flex flex-col">
          <span
            className={`w-fit px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border mb-1 ${statusColors[license.status] || 'text-gray-400 bg-gray-50 border-gray-100'}`}
          >
            {license.status}
          </span>
          <p className="text-[10px] font-medium text-gray-400">
            {license.expiry_date
              ? `Expires ${new Date(license.expiry_date).toLocaleDateString()}`
              : 'Lifetime Access'}
          </p>
        </div>
      </td>
      <td className="px-8 py-5 text-right">
        <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
            title="Modify Key"
          >
            <Edit className="w-4 h-4" />
          </button>

          {license.status !== 'active' && (
            <button
              onClick={() => onAction(license.id, 'activate', 'Activation')}
              disabled={actionLoading}
              className="p-2 text-slate-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-all disabled:opacity-30"
              title="Activate Key"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}

          {license.status !== 'inactive' && (
            <button
              onClick={() => onAction(license.id, 'deactivate', 'Deactivation')}
              disabled={actionLoading}
              className="p-2 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all disabled:opacity-30"
              title="Suspend Key"
            >
              <Power className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => {
              if (confirm('Permanently revoke and delete this license key?')) {
                onAction(license.id, 'delete', 'Revocation')
              }
            }}
            disabled={actionLoading}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-30"
            title="Revoke Key"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

function FactoryCard({
  factory,
  onEdit,
  onDelete,
  loading
}: {
  factory: any
  onEdit: () => void
  onDelete: () => void
  loading: boolean
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{factory.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{factory.location || 'No location set'}</p>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${factory.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
        >
          {factory.status}
        </span>
      </div>
      <div className="mt-4 flex space-x-3">
        <button onClick={onEdit} className="text-sm text-blue-600 hover:text-blue-900 font-medium">
          Edit
        </button>
        <button
          onClick={onDelete}
          disabled={loading}
          className="text-sm text-red-600 hover:text-red-900 font-medium disabled:opacity-50"
        >
          {loading ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  )
}

function SettingSection({
  title,
  icon,
  children
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
      <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-50 flex items-center space-x-3">
        {icon && <div className="p-2 bg-white rounded-lg shadow-sm text-orange-500">{icon}</div>}
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="p-6 space-y-1 divide-y divide-gray-50">{children}</div>
    </div>
  )
}

function SettingItem({
  label,
  value,
  onUpdate,
  type = 'text',
  options,
  validation
}: {
  label: string
  value: any
  onUpdate: (newValue: any) => void
  type?: 'text' | 'number' | 'select' | 'toggle'
  options?: { label: string; value: any }[]
  validation?: (value: any) => string | null
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (validation) {
      const errorMsg = validation(editValue)
      if (errorMsg) {
        setError(errorMsg)
        return
      }
    }
    setError(null)
    onUpdate(editValue)
    setIsEditing(false)
  }

  const handleToggle = () => {
    onUpdate(!value)
  }

  if (type === 'toggle') {
    return (
      <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
        <div>
          <span className="text-sm font-bold text-gray-700 block">{label}</span>
          <p className="text-[10px] text-gray-400 font-medium">Toggle system status</p>
        </div>
        <button
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-200 ease-in-out focus:outline-none ${
            value ? 'bg-orange-500' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              value ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
      <div className="flex-1 mr-4">
        <span className="text-sm font-bold text-gray-700 block">{label}</span>
        {error ? (
          <span className="text-[10px] text-red-500 font-bold animate-pulse">{error}</span>
        ) : (
          <p className="text-[10px] text-gray-400 font-medium">Click to modify configuration</p>
        )}
      </div>
      <div className="flex items-center">
        {isEditing ? (
          <form
            onSubmit={handleSubmit}
            className="flex items-center space-x-2 animate-in zoom-in-95 duration-200"
          >
            {type === 'select' ? (
              <select
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="bg-gray-50 border-none rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-orange-500/20"
                autoFocus
              >
                {options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={type === 'number' ? 'number' : 'text'}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="bg-gray-50 border-none rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-orange-500/20 w-32"
                autoFocus
              />
            )}
            <button
              type="submit"
              className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-all"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false)
                setEditValue(value)
                setError(null)
              }}
              className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-all"
            >
              <Plus className="w-4 h-4 rotate-45" />
            </button>
          </form>
        ) : (
          <div
            onClick={() => {
              setEditValue(value)
              setIsEditing(true)
            }}
            className="flex items-center group cursor-pointer"
          >
            <span className="text-xs font-black text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 group-hover:border-orange-200 group-hover:bg-orange-50 transition-all mr-2">
              {type === 'select'
                ? options?.find((o) => o.value === value)?.label || value
                : value?.toString()}
            </span>
            <div className="p-1.5 text-gray-300 group-hover:text-orange-500 transition-colors">
              <Edit className="w-3.5 h-3.5" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
