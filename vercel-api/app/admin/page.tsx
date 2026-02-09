'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  Key,
  Factory,
  Settings,
  BarChart3,
  RefreshCw,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeLicenses: 0,
    totalFactories: 0,
    systemHealth: 'good'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    setLoading(true)
    try {
      // Mock data - in production, fetch from API
      setTimeout(() => {
        setStats({
          totalUsers: 45,
          activeLicenses: 38,
          totalFactories: 12,
          systemHealth: 'good'
        })
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-1">System management and configuration</p>
        </div>
        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
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
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'licenses' && <LicensesTab />}
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
          ? 'border-primary-500 text-primary-600'
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

function UsersTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
        <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700">
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </button>
      </div>

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
            <TableRow name="John Doe" email="john@example.com" role="Admin" status="active" />
            <TableRow name="Jane Smith" email="jane@example.com" role="Manager" status="active" />
            <TableRow name="Bob Johnson" email="bob@example.com" role="User" status="active" />
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LicensesTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">License Management</h2>
        <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700">
          <Plus className="w-4 h-4 mr-2" />
          Generate License
        </button>
      </div>

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
            <LicenseRow
              key="ABCD-1234-EFGH-5678-4D"
              factory="Factory A"
              status="active"
              expiry="2024-12-31"
            />
            <LicenseRow
              key="XYZW-9876-IJKL-5432-1Y"
              factory="Factory B"
              status="active"
              expiry="2025-06-30"
            />
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
        <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700">
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

function TableRow({
  name,
  email,
  role,
  status
}: {
  name: string
  email: string
  role: string
  status: string
}) {
  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-gray-900">{name}</div>
          <div className="text-sm text-gray-500">{email}</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{role}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
          {status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button className="text-primary-600 hover:text-primary-900 mr-3">
          <Edit className="w-4 h-4 inline" />
        </button>
        <button className="text-red-600 hover:text-red-900">
          <Trash2 className="w-4 h-4 inline" />
        </button>
      </td>
    </tr>
  )
}

function LicenseRow({
  key,
  factory,
  status,
  expiry
}: {
  key: string
  factory: string
  status: string
  expiry: string
}) {
  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{key}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{factory}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
          {status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expiry}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button className="text-primary-600 hover:text-primary-900 mr-3">
          <Edit className="w-4 h-4 inline" />
        </button>
        <button className="text-red-600 hover:text-red-900">
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
