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

  const fetchAdminData = useCallback(async () => {
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
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
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
        setMessage({ type: 'success', text: res.message || 'User created successfully' })
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
      // Create update data (password is optional in update)
      const updateData: any = { ...formData }
      if (!updateData.password) delete updateData.password

      const res = await adminApi.updateUser(editingUser.id, updateData)
      if (res.success) {
        setMessage({ type: 'success', text: res.message || 'User updated successfully' })
        setShowEditModal(false)
        setEditingUser(null)
        setFormData({ phone: '', password: '', full_name: '', factory_name: '', role: 'user' })
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
      password: '', // Don't show existing password
      full_name: user.full_name || '',
      factory_name: user.factory_name || '',
      role: (user.role as any) || 'user'
    })
    setShowEditModal(true)
  }

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
        <button
          onClick={() => {
            setFormData({ phone: '', password: '', full_name: '', factory_name: '', role: 'user' })
            setShowAddModal(true)
          }}
          className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Search</label>
          <input
            type="text"
            placeholder="Search phone, name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Role</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="user">User</option>
            <option value="worker">Worker</option>
          </select>
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
            <option value="banned">Banned</option>
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

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-8 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New User</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <Plus className="w-6 h-6 transform rotate-45" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="0123456789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Factory Name</label>
                <input
                  type="text"
                  value={formData.factory_name}
                  onChange={(e) => setFormData({ ...formData, factory_name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                >
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="worker">Worker</option>
                  <option value="admin">Admin</option>
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
                  {isSubmitting ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-8 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit User</h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingUser(null)
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <Plus className="w-6 h-6 transform rotate-45" />
              </button>
            </div>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="0123456789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password (leave blank to keep current)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Factory Name</label>
                <input
                  type="text"
                  value={formData.factory_name}
                  onChange={(e) => setFormData({ ...formData, factory_name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                >
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="worker">Worker</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingUser(null)
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
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500 italic">
                  No users found
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
  )
}

function LicensesTab({ licenses, loading }: { licenses: any[]; loading: boolean }) {
  const [actionLoading, setActionLoading] = useState<{ [key: number]: boolean }>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingLicense, setEditingLicense] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [formData, setFormData] = useState({
    factoryName: '',
    durationCode: 'MONTH_1',
    machineId: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

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
        setMessage({ type: 'success', text: res.message || 'License generated successfully' })
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
        // status is usually handled via actions, but could be added here
      })
      if (res.success) {
        setMessage({ type: 'success', text: res.message || 'License updated successfully' })
        setShowEditModal(false)
        setEditingLicense(null)
        setFormData({ factoryName: '', durationCode: 'MONTH_1', machineId: '' })
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
      durationCode: 'MONTH_1', // Duration not applicable for update usually
      machineId: license.machine_id || ''
    })
    setShowEditModal(true)
  }

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
        <button
          onClick={() => {
            setFormData({ factoryName: '', durationCode: 'MONTH_1', machineId: '' })
            setShowAddModal(true)
          }}
          className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Generate License
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Search</label>
          <input
            type="text"
            placeholder="Search key, factory, machine..."
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
            <option value="expired">Expired</option>
            <option value="banned">Banned</option>
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

      {/* Generate License Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-8 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Generate New License</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <Plus className="w-6 h-6 transform rotate-45" />
              </button>
            </div>
            <form onSubmit={handleGenerateLicense} className="space-y-4">
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
                <label className="block text-sm font-medium text-gray-700">
                  Machine ID (Optional)
                </label>
                <input
                  type="text"
                  value={formData.machineId}
                  onChange={(e) => setFormData({ ...formData, machineId: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="Unique Machine Identifier"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Duration</label>
                <select
                  value={formData.durationCode}
                  onChange={(e) => setFormData({ ...formData, durationCode: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                >
                  <option value="MONTH_1">1 Month</option>
                  <option value="MONTH_3">3 Months</option>
                  <option value="MONTH_6">6 Months</option>
                  <option value="YEAR_1">1 Year</option>
                  <option value="LIFETIME">Lifetime</option>
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
                  {isSubmitting ? 'Generating...' : 'Generate License'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
        <div className={`p-3 rounded-full ${colorClasses[color] || 'bg-gray-50 text-gray-600'}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function StatusItem({ label, status }: { label: string; status: string }) {
  const statusColors: { [key: string]: string } = {
    operational: 'bg-green-100 text-green-800',
    degraded: 'bg-yellow-100 text-yellow-800',
    down: 'bg-red-100 text-red-800'
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm font-medium text-gray-900">{label}</span>
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}
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
