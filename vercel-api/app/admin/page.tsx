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
  CheckCircle
} from 'lucide-react'
import { adminApi } from '../../lib/api'

export default function AdminPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

  // Modal states
  const [showAddUser, setShowAddUser] = useState(false)
  const [showEditUser, setShowEditUser] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [showAddLicense, setShowAddLicense] = useState(false)
  const [showEditLicense, setShowEditLicense] = useState(false)
  const [editingLicense, setEditingLicense] = useState<any>(null)

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
          {message && (
            <div
              className={`mb-6 p-4 rounded-xl border flex items-center space-x-3 animate-in fade-in slide-in-from-top-4 ${
                message.type === 'success'
                  ? 'bg-green-50 border-green-100 text-green-700'
                  : 'bg-red-50 border-red-100 text-red-700'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <Ban className="w-5 h-5 flex-shrink-0" />
              )}
              <p className="text-sm font-medium">{message.text}</p>
              <button
                onClick={() => setMessage(null)}
                className="ml-auto opacity-50 hover:opacity-100"
              >
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>
          )}

          {activeTab === 'overview' && <OverviewTab stats={stats} loading={loading} />}
          {activeTab === 'users' && (
            <UsersTab
              users={users}
              loading={loading}
              showAddModal={showAddUser}
              setShowAddModal={setShowAddUser}
              showEditModal={showEditUser}
              setShowEditModal={setShowEditUser}
              editingUser={editingUser}
              setEditingUser={setEditingUser}
            />
          )}
          {activeTab === 'licenses' && (
            <LicensesTab
              licenses={licenses}
              loading={loading}
              showAddModal={showAddLicense}
              setShowAddModal={setShowAddLicense}
              showEditModal={showEditLicense}
              setShowEditModal={setShowEditLicense}
              editingLicense={editingLicense}
              setEditingLicense={setEditingLicense}
            />
          )}
          {activeTab === 'factories' && (
            <FactoriesTab factories={factories} loading={loading} onRefresh={fetchAdminData} />
          )}
          {activeTab === 'settings' && (
            <SettingsTab settings={settings} loading={loading} onRefresh={fetchAdminData} />
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
  showAddModal,
  setShowAddModal,
  showEditModal,
  setShowEditModal,
  editingUser,
  setEditingUser
}: {
  users: any[]
  loading: boolean
  showAddModal: boolean
  setShowAddModal: (show: boolean) => void
  showEditModal: boolean
  setShowEditModal: (show: boolean) => void
  editingUser: any
  setEditingUser: (user: any) => void
}) {
  const [actionLoading, setActionLoading] = useState<{ [key: number]: boolean }>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

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
        setMessage({ type: 'success', text: 'User created successfully' })
        setShowAddModal(false)
        setFormData({ phone: '', password: '', full_name: '', factory_name: '', role: 'user' })
        setTimeout(() => window.location.reload(), 1000)
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to create user' })
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
        setMessage({ type: 'success', text: 'User updated successfully' })
        setShowEditModal(false)
        setEditingUser(null)
        setTimeout(() => window.location.reload(), 1000)
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to update user' })
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

  const handleUserAction = async (userId: number, action: string, actionName: string) => {
    setActionLoading({ ...actionLoading, [userId]: true })
    try {
      let result: any
      if (action === 'activate') result = await adminApi.activateUser(userId)
      else if (action === 'deactivate') result = await adminApi.deactivateUser(userId)
      else if (action === 'ban') result = await adminApi.banUser(userId)
      else if (action === 'delete') result = await adminApi.deleteUser(userId)

      if (result?.success) {
        setMessage({ type: 'success', text: `${actionName} successful` })
        setTimeout(() => window.location.reload(), 1000)
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
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">User Management</h2>
          <p className="text-sm text-gray-500">Manage system access and permissions</p>
        </div>
        <button
          onClick={() => {
            setFormData({ phone: '', password: '', full_name: '', factory_name: '', role: 'user' })
            setShowAddModal(true)
          }}
          className="flex items-center justify-center px-6 py-3 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 active:scale-95"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create New User
        </button>
      </div>

      {/* Filters Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Search Directory
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search phone, name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400"
            />
          </div>
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="banned">Banned</option>
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

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Identity
                </th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Role
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
                    Loading secure directory...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-8 py-12 text-center text-gray-400 italic font-medium"
                  >
                    No identities matching filters
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

      {/* Modal - Unified styling for both Add and Edit */}
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
                  label="Full Name"
                  value={formData.full_name}
                  onChange={(v) => setFormData({ ...formData, full_name: v })}
                  placeholder="e.g. John Doe"
                  required
                />
                <InputField
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(v) => setFormData({ ...formData, phone: v })}
                  placeholder="0123456789"
                  required
                />
                <InputField
                  label={showEditModal ? 'New Password (optional)' : 'Access Password'}
                  value={formData.password}
                  onChange={(v) => setFormData({ ...formData, password: v })}
                  type="password"
                  required={showAddModal}
                />
                <InputField
                  label="Factory Affiliation"
                  value={formData.factory_name}
                  onChange={(v) => setFormData({ ...formData, factory_name: v })}
                  placeholder="Factory Name"
                />
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Assign Role
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
                  {isSubmitting ? 'Processing...' : showAddModal ? 'Create User' : 'Save Changes'}
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
  showAddModal,
  setShowAddModal,
  showEditModal,
  setShowEditModal,
  editingLicense,
  setEditingLicense
}: {
  licenses: any[]
  loading: boolean
  showAddModal: boolean
  setShowAddModal: (show: boolean) => void
  showEditModal: boolean
  setShowEditModal: (show: boolean) => void
  editingLicense: any
  setEditingLicense: (license: any) => void
}) {
  const [actionLoading, setActionLoading] = useState<{ [key: number]: boolean }>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

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
        setTimeout(() => window.location.reload(), 1000)
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
        setTimeout(() => window.location.reload(), 1000)
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

  const handleLicenseAction = async (licenseId: number, action: string, actionName: string) => {
    setActionLoading({ ...actionLoading, [licenseId]: true })
    try {
      let result: any
      if (action === 'activate') result = await adminApi.activateLicense(licenseId)
      else if (action === 'deactivate') result = await adminApi.deactivateLicense(licenseId)
      else if (action === 'ban') result = await adminApi.banLicense(licenseId)
      else if (action === 'delete') result = await adminApi.deleteLicense(licenseId)

      if (result?.success) {
        setMessage({ type: 'success', text: `${actionName} successful` })
        setTimeout(() => window.location.reload(), 1000)
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
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Search Registry</label>
          <input
            type="text"
            placeholder="Search key, factory, machine..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Key Status</label>
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
        <div className={`p-4 rounded-xl border flex items-center space-x-3 ${message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
          <p className="text-sm font-bold">{message.text}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">License Key</th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Affiliation</th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={4} className="px-8 py-12 text-center text-gray-400 italic font-medium">Loading secure registry...</td></tr>
              ) : filteredLicenses.length === 0 ? (
                <tr><td colSpan={4} className="px-8 py-12 text-center text-gray-400 italic font-medium">No licenses matching filters</td></tr>
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
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">{showAddModal ? 'Generate Key' : 'Modify Key'}</h3>
              <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><Plus className="w-5 h-5 rotate-45 text-gray-400" /></button>
            </div>
            <form onSubmit={showAddModal ? handleGenerateLicense : handleEditLicense} className="p-8 space-y-5">
              <div className="space-y-4">
                <InputField label="Factory Name" value={formData.factoryName} onChange={(v) => setFormData({ ...formData, factoryName: v })} placeholder="Target Factory" required />
                <InputField label="Machine ID (Optional)" value={formData.machineId} onChange={(v) => setFormData({ ...formData, machineId: v })} placeholder="Hardware Identifier" />
                {showAddModal && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Duration Period</label>
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
                <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-all">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-2 py-3 px-8 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50">
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

      {/* Edit License Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-8 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit License</h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingLicense(null)
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <Plus className="w-6 h-6 transform rotate-45" />
              </button>
            </div>
            <form onSubmit={handleEditLicense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Factory Name</label>
                <input
                  type="text"
                  required
                  value={formData.factoryName}
                  onChange={(e) => setFormData({ ...formData, factoryName: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="Factory Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Machine ID</label>
                <input
                  type="text"
                  value={formData.machineId}
                  onChange={(e) => setFormData({ ...formData, machineId: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="Unique Machine Identifier"
                />
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingLicense(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-orange-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
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
            ) : filteredLicenses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500 italic">
                  No licenses found
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
  )
}

function FactoriesTab() {
  const [factories, setFactories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<{ [key: number]: boolean }>({})
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

  useEffect(() => {
    fetchFactories()
  }, [])

  const fetchFactories = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getFactories()
      setFactories(res.factories)
    } catch (error) {
      console.error('Failed to fetch factories:', error)
    } finally {
      setLoading(false)
    }
  }

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
        setMessage({ type: 'success', text: res.message || 'Factory added successfully' })
        setShowAddModal(false)
        setFormData({ name: '', location: '', status: 'active' })
        fetchFactories()
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
        setMessage({ type: 'success', text: res.message || 'Factory updated successfully' })
        setShowEditModal(false)
        setEditingFactory(null)
        setFormData({ name: '', location: '', status: 'active' })
        fetchFactories()
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

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this factory?')) return

    setActionLoading({ ...actionLoading, [id]: true })
    try {
      const res = await adminApi.deleteFactory(id)
      if (res.success) {
        setMessage({ type: 'success', text: res.message || 'Factory deleted' })
        fetchFactories()
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Factory Management</h2>
        <button
          onClick={() => {
            setFormData({ name: '', location: '', status: 'active' })
            setShowAddModal(true)
          }}
          className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Factory
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Search</label>
          <input
            type="text"
            placeholder="Search factory name, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}
        >
          {message.text}
        </div>
      )}

      {/* Add Factory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-8 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New Factory</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <Plus className="w-6 h-6 transform rotate-45" />
              </button>
            </div>
            <form onSubmit={handleAddFactory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Factory Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="Factory A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="Cairo, Egypt"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-orange-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add Factory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Factory Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-8 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Factory</h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingFactory(null)
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <Plus className="w-6 h-6 transform rotate-45" />
              </button>
            </div>
            <form onSubmit={handleEditFactory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Factory Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="Factory A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="Cairo, Egypt"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingFactory(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-orange-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-2 text-gray-500">Loading factories...</p>
        </div>
      ) : filteredFactories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <Factory className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 italic">No factories found</p>
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
    </div>
  )
}

function SettingsTab() {
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getSettings()
      setSettings(res.settings)
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (key: string, value: any) => {
    setSaving(true)
    setMessage(null)
    try {
      const updatedSettings = { ...settings, [key]: value }
      const res = await adminApi.updateSettings(updatedSettings)
      if (res.success) {
        setSettings(updatedSettings)
        setMessage({ type: 'success', text: 'Setting updated successfully' })
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
      <div className="text-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
        <p className="mt-2 text-gray-500">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">System Settings</h2>
        {saving && (
          <div className="flex items-center text-sm text-gray-500">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            Saving changes...
          </div>
        )}
      </div>

      {message && (
        <div
          className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 space-y-8">
        <SettingSection title="General Settings">
          <SettingItem
            label="Application Name"
            value={settings?.appName || 'Dates Factory Manager'}
            onUpdate={(val) => handleUpdate('appName', val)}
            validation={(val) => (val.length < 3 ? 'Name too short' : null)}
          />
          <SettingItem
            label="Support Email"
            value={settings?.supportEmail || 'support@datesfactory.com'}
            onUpdate={(val) => handleUpdate('supportEmail', val)}
            validation={(val) =>
              !val.includes('@') || !val.includes('.') ? 'Invalid email' : null
            }
          />
          <SettingItem
            label="Maintenance Mode"
            value={settings?.maintenanceMode || false}
            type="toggle"
            onUpdate={(val) => handleUpdate('maintenanceMode', val)}
          />
        </SettingSection>

        <SettingSection title="User & Registration">
          <SettingItem
            label="Allow User Registration"
            value={settings?.allowRegistration ?? true}
            type="toggle"
            onUpdate={(val) => handleUpdate('allowRegistration', val)}
          />
          <SettingItem
            label="Default User Role"
            value={settings?.defaultUserRole || 'user'}
            type="select"
            options={[
              { label: 'User', value: 'user' },
              { label: 'Worker', value: 'worker' },
              { label: 'Manager', value: 'manager' }
            ]}
            onUpdate={(val) => handleUpdate('defaultUserRole', val)}
          />
          <SettingItem
            label="Password Policy"
            value={settings?.passwordPolicy || 'Minimum 6 characters'}
            onUpdate={(val) => handleUpdate('passwordPolicy', val)}
          />
        </SettingSection>

        <SettingSection title="Security & Sessions">
          <SettingItem
            label="Session Timeout"
            value={settings?.sessionTimeout || '30 minutes'}
            type="select"
            options={[
              { label: '15 minutes', value: '15 minutes' },
              { label: '30 minutes', value: '30 minutes' },
              { label: '1 hour', value: '1 hour' },
              { label: '4 hours', value: '4 hours' },
              { label: '8 hours', value: '8 hours' }
            ]}
            onUpdate={(val) => handleUpdate('sessionTimeout', val)}
          />
        </SettingSection>

        <SettingSection title="Database & System">
          <SettingItem
            label="Connection Pool Size"
            value={settings?.connectionPool || 10}
            type="number"
            onUpdate={(val) => handleUpdate('connectionPool', parseInt(val))}
            validation={(val) =>
              parseInt(val) < 1 || parseInt(val) > 100 ? 'Must be between 1 and 100' : null
            }
          />
          <SettingItem
            label="Backup Frequency"
            value={settings?.backupFrequency || 'Daily'}
            type="select"
            options={[
              { label: 'Hourly', value: 'Hourly' },
              { label: 'Daily', value: 'Daily' },
              { label: 'Weekly', value: 'Weekly' }
            ]}
            onUpdate={(val) => handleUpdate('backupFrequency', val)}
          />
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
        <button
          onClick={onEdit}
          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
          title="Edit"
        >
          <Edit className="w-4 h-4 inline" />
        </button>
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
          onClick={() => {
            if (confirm('Are you sure you want to delete this user?')) {
              onAction(user.id, 'delete', 'Delete')
            }
          }}
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
  onEdit,
  onAction,
  actionLoading
}: {
  license: any
  onEdit: () => void
  onAction: (licenseId: number, action: string, actionName: string) => void
  actionLoading: boolean
}) {
  const statusColors: { [key: string]: string } = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-yellow-100 text-yellow-800',
    expired: 'bg-red-100 text-red-800',
    banned: 'bg-red-100 text-red-800'
  }

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-mono font-medium text-gray-900">{license.license_key}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {license.factory_name || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[license.status] || 'bg-gray-100 text-gray-800'}`}
        >
          {license.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {license.expiry_date ? new Date(license.expiry_date).toLocaleDateString() : 'No expiry'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
        <button
          onClick={onEdit}
          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
          title="Edit"
        >
          <Edit className="w-4 h-4 inline" />
        </button>
        {license.status !== 'active' && (
          <button
            onClick={() => onAction(license.id, 'activate', 'Activate')}
            disabled={actionLoading}
            className="text-green-600 hover:text-green-900 disabled:opacity-50"
            title="Activate"
          >
            <CheckCircle className="w-4 h-4 inline" />
          </button>
        )}
        {license.status !== 'inactive' && (
          <button
            onClick={() => onAction(license.id, 'deactivate', 'Deactivate')}
            disabled={actionLoading}
            className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
            title="Deactivate"
          >
            <Power className="w-4 h-4 inline" />
          </button>
        )}
        <button
          onClick={() => {
            if (confirm('Are you sure you want to delete this license?')) {
              onAction(license.id, 'delete', 'Delete')
            }
          }}
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

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-md font-medium text-gray-700 border-b pb-2">{title}</h3>
      <div className="grid grid-cols-1 gap-4">{children}</div>
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
    const newValue = !value
    onUpdate(newValue)
  }

  if (type === 'toggle') {
    return (
      <div className="flex items-center justify-between py-3">
        <span className="text-sm text-gray-600">{label}</span>
        <button
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
            value ? 'bg-orange-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              value ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex flex-col">
        <span className="text-sm text-gray-600">{label}</span>
        {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
      </div>
      <div className="flex items-center">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            {type === 'select' ? (
              <select
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="text-sm border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-500"
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
                className={`text-sm border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                  error ? 'border-red-500' : ''
                }`}
                autoFocus
              />
            )}
            <button
              type="submit"
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false)
                setEditValue(value)
                setError(null)
              }}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Cancel
            </button>
          </form>
        ) : (
          <>
            <span className="text-sm font-medium text-gray-900 mr-4">
              {type === 'select'
                ? options?.find((o) => o.value === value)?.label || value
                : value?.toString()}
            </span>
            <button
              onClick={() => {
                setEditValue(value)
                setIsEditing(true)
              }}
              className="text-orange-600 hover:text-orange-900"
            >
              <Edit className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
