/**
 * API Client for Dates Factory Manager
 * Handles communication with the backend API
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dfm-mu.vercel.app'

/**
 * Generic API request handler
 */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  }

  // Add auth token if available
  const token = localStorage.getItem('token')
  if (token) {
    defaultOptions.headers = {
      ...defaultOptions.headers,
      Authorization: `Bearer ${token}`
    }
  }

  try {
    const response = await fetch(url, defaultOptions)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || error.error || 'API request failed')
    }

    return await response.json()
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}

/**
 * Authentication API
 */
export const authApi = {
  /**
   * Login user
   */
  login: async (phone: string, password: string) => {
    return apiRequest<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password })
    })
  },

  /**
   * Register new user
   */
  register: async (data: RegisterData) => {
    return apiRequest<{ success: boolean; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  /**
   * Logout user
   */
  logout: async () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}

/**
 * Admin API
 */
export const adminApi = {
  /**
   * Get system stats
   */
  getStats: async () => {
    return apiRequest<{ stats: any }>('/api/admin/stats')
  },

  /**
   * Get all users
   */
  getUsers: async () => {
    return apiRequest<{ users: any[] }>('/api/admin/users')
  },

  /**
   * Get all licenses
   */
  getLicenses: async () => {
    return apiRequest<{ licenses: any[] }>('/api/admin/licenses')
  }
}

/**
 * Sync API
 */
export const syncApi = {
  /**
   * Get sync status
   */
  getStatus: async () => {
    return apiRequest<SyncStatus>('/api/sync/status')
  },

  /**
   * Push changes to cloud
   */
  pushChanges: async (changes: SyncChange[], checkpoint: number) => {
    return apiRequest<SyncResult>('/api/sync/push', {
      method: 'POST',
      body: JSON.stringify({ changes, last_sync_checkpoint: checkpoint })
    })
  },

  /**
   * Pull changes from cloud
   */
  pullChanges: async (checkpoint: number) => {
    return apiRequest<SyncResult>('/api/sync/pull', {
      method: 'POST',
      body: JSON.stringify({ last_sync_checkpoint: checkpoint })
    })
  },

  /**
   * Full bidirectional sync
   */
  fullSync: async (changes: SyncChange[], checkpoint: number) => {
    return apiRequest<SyncResult>('/api/sync/full', {
      method: 'POST',
      body: JSON.stringify({ changes, last_sync_checkpoint: checkpoint })
    })
  },

  /**
   * Get database info
   */
  getDatabaseInfo: async () => {
    return apiRequest<DatabaseInfo>('/api/sync/database-info', {
      method: 'POST',
      body: JSON.stringify({})
    })
  }
}

/**
 * Dashboard API
 */
export const dashboardApi = {
  /**
   * Get dashboard statistics
   */
  getStats: async () => {
    return apiRequest<DashboardStats>('/api/dashboard/stats')
  },

  /**
   * Get recent activity
   */
  getRecentActivity: async (limit = 10) => {
    return apiRequest<ActivityItem[]>('/api/dashboard/activity', {
      method: 'POST',
      body: JSON.stringify({ limit })
    })
  }
}

/**
 * Customers API
 */
export const customersApi = {
  /**
   * Get all customers
   */
  getAll: async () => {
    return apiRequest<Customer[]>('/api/customers')
  },

  /**
   * Get customer by ID
   */
  getById: async (id: number) => {
    return apiRequest<Customer>(`/api/customers/${id}`)
  },

  /**
   * Create new customer
   */
  create: async (data: Partial<Customer>) => {
    return apiRequest<Customer>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  /**
   * Update customer
   */
  update: async (id: number, data: Partial<Customer>) => {
    return apiRequest<Customer>(`/api/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  /**
   * Delete customer
   */
  delete: async (id: number) => {
    return apiRequest<{ success: boolean }>(`/api/customers/${id}`, {
      method: 'DELETE'
    })
  }
}

/**
 * Weighbridge API
 */
export const weighbridgeApi = {
  /**
   * Get all weighbridge records
   */
  getAll: async () => {
    return apiRequest<WeighbridgeRecord[]>('/api/weighbridge')
  },

  /**
   * Create new weighbridge record
   */
  create: async (data: Partial<WeighbridgeRecord>) => {
    return apiRequest<WeighbridgeRecord>('/api/weighbridge', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
}

/**
 * Finance API
 */
export const financeApi = {
  /**
   * Get all finance records
   */
  getAll: async () => {
    return apiRequest<FinanceRecord[]>('/api/finance')
  },

  /**
   * Create new finance record
   */
  create: async (data: Partial<FinanceRecord>) => {
    return apiRequest<FinanceRecord>('/api/finance', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
}

/**
 * Admin API
 */
export const adminApi = {
  /**
   * Get all users
   */
  getUsers: async () => {
    return apiRequest<User[]>('/api/admin/users')
  },

  /**
   * Create user
   */
  createUser: async (data: Partial<User>) => {
    return apiRequest<User>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  /**
   * Update user
   */
  updateUser: async (id: number, data: Partial<User>) => {
    return apiRequest<User>(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  /**
   * Delete user
   */
  deleteUser: async (id: number) => {
    return apiRequest<{ success: boolean }>(`/api/admin/users/${id}`, {
      method: 'DELETE'
    })
  },

  /**
   * Get all licenses
   */
  getLicenses: async () => {
    return apiRequest<License[]>('/api/admin/licenses')
  },

  /**
   * Generate license
   */
  generateLicense: async (data: Partial<License>) => {
    return apiRequest<License>('/api/admin/licenses', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  /**
   * Revoke license
   */
  revokeLicense: async (id: number) => {
    return apiRequest<{ success: boolean }>(`/api/admin/licenses/${id}`, {
      method: 'DELETE'
    })
  }
}

/**
 * Type definitions
 */
export interface User {
  id: number
  username: string
  email: string
  role: 'admin' | 'manager' | 'user'
  factoryName?: string
  createdAt: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
  factoryName: string
}

export interface SyncStatus {
  status: string
  timestamp: string
  version: string
  service: string
}

export interface SyncChange {
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record_id: number
  data: any
  client_timestamp: number
}

export interface SyncResult {
  success: boolean
  processed: number
  failed: number
  remote_changes: SyncChange[]
  new_checkpoint: number
}

export interface DatabaseInfo {
  success: boolean
  machineId: string
  databaseName: string
  lastSync: string | null
  syncStatus: string
}

export interface DashboardStats {
  customers: number
  weighbridge: number
  crates: number
  finance: number
}

export interface ActivityItem {
  id: number
  type: string
  message: string
  timestamp: string
}

export interface Customer {
  id: number
  name: string
  type: 'supplier' | 'customer'
  phone: string
  address?: string
  createdAt: string
}

export interface WeighbridgeRecord {
  id: number
  customerId: number
  weight: number
  date: string
  notes?: string
}

export interface FinanceRecord {
  id: number
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
}

export interface License {
  id: number
  licenseKey: string
  machineId: string
  factoryName: string
  durationCode: string
  expiryDate: string
  status: 'active' | 'inactive' | 'expired'
  createdAt: string
}
