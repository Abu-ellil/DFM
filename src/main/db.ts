import initSqlJs, { Database, SqlJsStatic } from 'sql.js'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import bcrypt from 'bcryptjs'
import { is } from '@electron-toolkit/utils'

let db: Database | null = null
let SQL: SqlJsStatic | null = null

// Auto-save system
let saveTimer: NodeJS.Timeout | null = null
let saveInterval: NodeJS.Timeout | null = null
let isDirty = false
const SAVE_DELAY = 2000 // Save 2 seconds after last change
const SAVE_INTERVAL = 30000 // Force save every 30 seconds

export const getDbPath = (): string => {
  if (is.dev) {
    return path.join(app.getAppPath(), 'date_factory_v2.db')
  }
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'date_factory_v2.db')
}

const initSchema = (db: Database): void => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'employee',
    telegram_id INTEGER UNIQUE,
    phone TEXT,
    full_name TEXT,
    machine_id TEXT,
    web_password TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`)

  // Customers table
  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    phone TEXT,
    balance REAL DEFAULT 0,
    season_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`)

  // Suppliers table (separated from customers)
  db.run(`CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    phone TEXT,
    commission_rate REAL DEFAULT 0,
    crates_on_hand INTEGER DEFAULT 0,
    balance REAL DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`)

  // Date Types table
  db.run(`CREATE TABLE IF NOT EXISTS date_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`)

  // Crate Types table
  db.run(`CREATE TABLE IF NOT EXISTS crate_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    weight REAL NOT NULL,
    is_default INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`)

  // Daily prices table
  db.run(`CREATE TABLE IF NOT EXISTS daily_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL UNIQUE,
    price_per_qantar REAL NOT NULL,
    qantar_weight REAL DEFAULT 100.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`)

  // Weighbridge transactions table
  db.run(`CREATE TABLE IF NOT EXISTS weighbridge (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    customer_id INTEGER NOT NULL,
    date_type_id INTEGER,
    gross_weight REAL DEFAULT 0,
    net_weight REAL NOT NULL,
    price_per_qantar REAL NOT NULL,
    total REAL NOT NULL,
    crates_count INTEGER DEFAULT 0,
    commission REAL DEFAULT 0,
    notes TEXT,
    season_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`)

  // Crates tracking table
  db.run(`CREATE TABLE IF NOT EXISTS crates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    customer_id INTEGER NOT NULL,
    crate_type_id INTEGER,
    crates_out INTEGER DEFAULT 0,
    crates_returned INTEGER DEFAULT 0,
    handler TEXT,
    notes TEXT,
    season_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`)

  // Finance table
  db.run(`CREATE TABLE IF NOT EXISTS finance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    customer_id INTEGER NOT NULL,
    transaction_type TEXT NOT NULL,
    amount_paid REAL DEFAULT 0,
    amount_received REAL DEFAULT 0,
    notes TEXT,
    season_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`)

  // Settings table
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )`)

  // Supervisors table
  db.run(`CREATE TABLE IF NOT EXISTS supervisors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`)

  // Sync queue table
  db.run(`CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id INTEGER,
    data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    synced INTEGER DEFAULT 0
  )`)

  // Telegram users table
  db.run(`CREATE TABLE IF NOT EXISTS telegram_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER NOT NULL UNIQUE,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    user_id INTEGER,
    status TEXT DEFAULT 'pending',
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`)

  // User roles table
  db.run(`CREATE TABLE IF NOT EXISTS user_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    assigned_by INTEGER,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id)
  )`)

  // Telegram registrations table
  db.run(`CREATE TABLE IF NOT EXISTS telegram_registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER NOT NULL UNIQUE,
    requested_role TEXT,
    full_name TEXT,
    phone TEXT,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by INTEGER,
    reviewed_at TIMESTAMP,
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
  )`)

  // Notification queue table
  db.run(`CREATE TABLE IF NOT EXISTS notification_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER NOT NULL,
    notification_type TEXT NOT NULL,
    title TEXT,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'normal',
    sent INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    error_message TEXT,
    FOREIGN KEY (telegram_id) REFERENCES telegram_users(telegram_id)
  )`)

  // Notification preferences table
  db.run(`CREATE TABLE IF NOT EXISTS notification_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER NOT NULL UNIQUE,
    receive_reports INTEGER DEFAULT 1,
    receive_alerts INTEGER DEFAULT 1,
    receive_tasks INTEGER DEFAULT 1,
    quiet_hours_start TEXT,
    quiet_hours_end TEXT,
    FOREIGN KEY (telegram_id) REFERENCES telegram_users(telegram_id)
  )`)

  // Role permissions table
  db.run(`CREATE TABLE IF NOT EXISTS role_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL,
    permission TEXT NOT NULL,
    granted INTEGER DEFAULT 1,
    UNIQUE(role, permission)
  )`)

  // Sales products table
  db.run(`CREATE TABLE IF NOT EXISTS sales_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    unit_type TEXT NOT NULL,
    weight_per_unit REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`)

  // Sales invoices table
  db.run(`CREATE TABLE IF NOT EXISTS sales_invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    buyer_name TEXT NOT NULL,
    buyer_phone TEXT,
    total_weight REAL NOT NULL,
    total_amount REAL NOT NULL,
    payment_method TEXT DEFAULT 'نقدا',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`)

  // Sales items table
  db.run(`CREATE TABLE IF NOT EXISTS sales_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price_per_kg REAL NOT NULL,
    total_weight REAL NOT NULL,
    total_amount REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES sales_invoices(id),
    FOREIGN KEY (product_id) REFERENCES sales_products(id)
  )`)

  // Indexes
  db.run(
    'CREATE INDEX IF NOT EXISTS idx_weighbridge_customer_date ON weighbridge(customer_id, date)'
  )
  db.run('CREATE INDEX IF NOT EXISTS idx_finance_customer_date ON finance(customer_id, date)')
  db.run('CREATE INDEX IF NOT EXISTS idx_crates_customer_date ON crates(customer_id, date)')
  db.run('CREATE INDEX IF NOT EXISTS idx_suppliers_type ON suppliers(type)')
  db.run('CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active)')
  // Note: seasons indexes are created in runSeasonsMigration after the table is created
  db.run('CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON sync_queue(created_at)')
  db.run('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)')
  db.run('CREATE INDEX IF NOT EXISTS idx_telegram_users_telegram_id ON telegram_users(telegram_id)')
  db.run('CREATE INDEX IF NOT EXISTS idx_telegram_users_status ON telegram_users(status)')
  db.run(
    'CREATE INDEX IF NOT EXISTS idx_telegram_registrations_status ON telegram_registrations(status)'
  )
  db.run('CREATE INDEX IF NOT EXISTS idx_notification_queue_sent ON notification_queue(sent)')
  db.run(
    'CREATE INDEX IF NOT EXISTS idx_notification_queue_created ON notification_queue(created_at)'
  )

  // Performance indexes for customer account queries
  db.run(
    'CREATE INDEX IF NOT EXISTS idx_weighbridge_customer_total ON weighbridge(customer_id, total)'
  )
  db.run(
    'CREATE INDEX IF NOT EXISTS idx_finance_customer_paid ON finance(customer_id, amount_paid)'
  )
  db.run(
    'CREATE INDEX IF NOT EXISTS idx_finance_customer_received ON finance(customer_id, amount_received)'
  )
  db.run(
    'CREATE INDEX IF NOT EXISTS idx_crates_customer_balance ON crates(customer_id, crates_out, crates_returned)'
  )

  // Sales indexes
  db.run('CREATE INDEX IF NOT EXISTS idx_sales_invoices_date ON sales_invoices(date)')
  db.run('CREATE INDEX IF NOT EXISTS idx_sales_invoices_buyer ON sales_invoices(buyer_name)')
  db.run('CREATE INDEX IF NOT EXISTS idx_sales_items_invoice ON sales_items(invoice_id)')
  db.run('CREATE INDEX IF NOT EXISTS idx_sales_items_product ON sales_items(product_id)')

  // Seed default admin if not exists
  const res = db.exec("SELECT id FROM users WHERE username = 'admin'")
  if (res.length === 0 || res[0].values.length === 0) {
    const salt = bcrypt.genSaltSync(10)
    const hash = bcrypt.hashSync('admin123', salt)
    db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [
      'admin',
      hash,
      'admin'
    ])
  }

  // Seed default settings
  const defaultSettings = {
    crate_weight: '2',
    qantar_weight: '45',
    company_name: 'مصنع التمور - الإصدار الثاني',
    company_address: '',
    company_phone: '',
    telegram_token: '',
    telegram_chat_id: '',
    telegram_bot_enabled: '0'
  }

  const stmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)')
  Object.entries(defaultSettings).forEach(([key, value]) => {
    stmt.run([key, value])
  })
  stmt.free()

  // Seed default role permissions
  const defaultPermissions = [
    // Owner permissions
    ['owner', 'view_reports', 1],
    ['owner', 'view_finance', 1],
    ['owner', 'manage_users', 1],
    ['owner', 'manage_settings', 1],
    ['owner', 'send_notifications', 1],
    ['owner', 'approve_registrations', 1],
    ['owner', 'view_operations', 1],
    ['owner', 'manage_tasks', 1],
    // Manager permissions
    ['manager', 'view_reports', 1],
    ['manager', 'view_operations', 1],
    ['manager', 'manage_tasks', 1],
    ['manager', 'send_notifications', 1],
    // Worker permissions
    ['worker', 'view_own_tasks', 1],
    ['worker', 'update_task_status', 1]
  ]

  const permStmt = db.prepare(
    'INSERT OR IGNORE INTO role_permissions (role, permission, granted) VALUES (?, ?, ?)'
  )
  defaultPermissions.forEach(([role, permission, granted]) => {
    permStmt.run([role, permission, granted])
  })
  permStmt.free()

  // Run sync-related migrations
  runSyncMigrations(db)

  // Run web auth migrations
  runWebAuthMigrations(db)

  // Run payment methods migration
  runPaymentMethodsMigration(db)

  // Run seasons migration
  runSeasonsMigration(db)

  // Run season isolation migration
  runSeasonIsolationMigration(db)

  // Season isolation indexes (must run AFTER runSeasonIsolationMigration adds season_id columns)
  db.run('CREATE INDEX IF NOT EXISTS idx_customers_season ON customers(season_id)')
  db.run('CREATE INDEX IF NOT EXISTS idx_weighbridge_season ON weighbridge(season_id)')
  db.run('CREATE INDEX IF NOT EXISTS idx_finance_season ON finance(season_id)')
  db.run('CREATE INDEX IF NOT EXISTS idx_crates_season ON crates(season_id)')
}

/**
 * Add sync-related columns and tables
 */
const runSyncMigrations = (db: Database): void => {
  // Tables that need sync columns
  // Note: 'seasons' is excluded here - it will be created in runSeasonsMigration
  const syncTables = [
    'customers',
    'suppliers',
    'weighbridge',
    'crates',
    'finance',
    'date_types',
    'crate_types',
    'daily_prices',
    'supervisors',
    'users',
    'telegram_users',
    'telegram_registrations',
    'user_roles',
    'notification_queue',
    'notification_preferences',
    'role_permissions',
    'sales_products',
    'sales_invoices',
    'sales_items'
  ]

  // Add sync columns to each table if they don't exist
  syncTables.forEach((table) => {
    try {
      db.run(`ALTER TABLE ${table} ADD COLUMN _client_id TEXT`)
    } catch {
      // Column already exists, ignore error
    }
    try {
      db.run(`ALTER TABLE ${table} ADD COLUMN _synced_at INTEGER`)
    } catch {
      // Column already exists, ignore error
    }
    try {
      db.run(`ALTER TABLE ${table} ADD COLUMN _version INTEGER DEFAULT 1`)
    } catch {
      // Column already exists, ignore error
    }
  })

  // Add additional columns to sync_queue table
  try {
    db.run(`ALTER TABLE sync_queue ADD COLUMN client_timestamp INTEGER`)
  } catch {
    // Column already exists, ignore error
  }
  try {
    db.run(`ALTER TABLE sync_queue ADD COLUMN sync_attempt_count INTEGER DEFAULT 0`)
  } catch {
    // Column already exists, ignore error
  }
  try {
    db.run(`ALTER TABLE sync_queue ADD COLUMN last_sync_error TEXT`)
  } catch {
    // Column already exists, ignore error
  }

  // Create conflict log table
  db.run(`CREATE TABLE IF NOT EXISTS _conflict_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    record_id INTEGER,
    local_data TEXT,
    remote_data TEXT,
    resolution TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`)

  // Create sync metadata table
  db.run(`CREATE TABLE IF NOT EXISTS _sync_metadata (
    key TEXT PRIMARY KEY,
    value TEXT
  )`)

  // Create indexes for sync tables
  db.run('CREATE INDEX IF NOT EXISTS idx_sync_queue_synced ON sync_queue(synced)')
  db.run(
    'CREATE INDEX IF NOT EXISTS idx_conflict_log_table ON _conflict_log(table_name, record_id)'
  )
}

/**
 * Add web authentication columns for existing databases
 */
const runWebAuthMigrations = (db: Database): void => {
  // Add phone column to users table if it doesn't exist (for backward compatibility)
  try {
    db.run(`ALTER TABLE users ADD COLUMN phone TEXT`)
  } catch {
    // Column already exists, ignore error
  }
  // Add full_name column to users table if it doesn't exist (for backward compatibility)
  try {
    db.run(`ALTER TABLE users ADD COLUMN full_name TEXT`)
  } catch {
    // Column already exists, ignore error
  }
  // Add machine_id and web_password columns to users table if they don't exist
  try {
    db.run(`ALTER TABLE users ADD COLUMN machine_id TEXT`)
  } catch {
    // Column already exists, ignore error
  }
  try {
    db.run(`ALTER TABLE users ADD COLUMN web_password TEXT`)
  } catch {
    // Column already exists, ignore error
  }

  // Create index for machine_id
  try {
    db.run('CREATE INDEX IF NOT EXISTS idx_users_machine_id ON users(machine_id)')
  } catch {
    // Index already exists or error occurred
  }

  // Create index for phone
  try {
    db.run('CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)')
  } catch {
    // Index already exists or error occurred
  }
}

/**
 * Add payment method columns to finance table
 */
const runPaymentMethodsMigration = (db: Database): void => {
  try {
    db.run(`ALTER TABLE finance ADD COLUMN payment_method TEXT DEFAULT 'نقدا'`)
  } catch {
    // Column already exists, ignore error
  }
  try {
    db.run(`ALTER TABLE finance ADD COLUMN receipt_file TEXT`)
  } catch {
    // Column already exists, ignore error
  }
  try {
    db.run(`ALTER TABLE finance ADD COLUMN receipt_reference TEXT`)
  } catch {
    // Column already exists, ignore error
  }
}

/**
 * Add seasons table and indexes
 */
const runSeasonsMigration = (db: Database): void => {
  // Create seasons table if it doesn't exist
  db.run(`CREATE TABLE IF NOT EXISTS seasons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`)

  // Create indexes for seasons table
  db.run('CREATE INDEX IF NOT EXISTS idx_seasons_dates ON seasons(start_date, end_date)')
  db.run('CREATE INDEX IF NOT EXISTS idx_seasons_active ON seasons(is_active)')
}

/**
 * Add season_id columns to existing tables for season isolation
 */
const runSeasonIsolationMigration = (db: Database): void => {
  // First, ensure seasons table exists
  db.run(`CREATE TABLE IF NOT EXISTS seasons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`)

  // Add season_id to customers table
  try {
    db.run(`ALTER TABLE customers ADD COLUMN season_id INTEGER`)
  } catch {
    // Column already exists, ignore error
  }

  // Add season_id to weighbridge table
  try {
    db.run(`ALTER TABLE weighbridge ADD COLUMN season_id INTEGER`)
  } catch {
    // Column already exists, ignore error
  }

  // Add season_id to finance table
  try {
    db.run(`ALTER TABLE finance ADD COLUMN season_id INTEGER`)
  } catch {
    // Column already exists, ignore error
  }

  // Add season_id to crates table
  try {
    db.run(`ALTER TABLE crates ADD COLUMN season_id INTEGER`)
  } catch {
    // Column already exists, ignore error
  }

  // Create indexes for season_id if they don't exist
  try {
    db.run('CREATE INDEX IF NOT EXISTS idx_customers_season ON customers(season_id)')
  } catch {}
  try {
    db.run('CREATE INDEX IF NOT EXISTS idx_weighbridge_season ON weighbridge(season_id)')
  } catch {}
  try {
    db.run('CREATE INDEX IF NOT EXISTS idx_finance_season ON finance(season_id)')
  } catch {}
  try {
    db.run('CREATE INDEX IF NOT EXISTS idx_crates_season ON crates(season_id)')
  } catch {}
  try {
    db.run('CREATE INDEX IF NOT EXISTS idx_seasons_dates ON seasons(start_date, end_date)')
  } catch {}
  try {
    db.run('CREATE INDEX IF NOT EXISTS idx_seasons_active ON seasons(is_active)')
  } catch {}
}

export const initializeDatabase = async (force: boolean = false): Promise<Database> => {
  if (db && !force) return db

  if (db) {
    try {
      db.close()
    } catch {
      // Ignore error when closing database
    }
  }

  try {
    SQL = await initSqlJs()
    const dbPath = getDbPath()
    const dbDir = path.dirname(dbPath)

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }

    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath)
      db = new SQL.Database(fileBuffer)
    } else {
      db = new SQL.Database()
    }

    initSchema(db)
    await saveDatabase()
    startAutoSave() // Start auto-save system

    return db
  } catch (error) {
    db = null
    console.error('Database initialization error:', error)
    throw error
  }
}

export const saveDatabase = async (): Promise<void> => {
  if (!db) return
  const dbPath = getDbPath()
  const data = db.export()
  const buffer = Buffer.from(data)
  await fs.promises.writeFile(dbPath, buffer)
  isDirty = false
}

/**
 * Request a database save. Uses debouncing to avoid frequent writes.
 * Call this after any database modification.
 */
export const requestSave = (): void => {
  isDirty = true

  // Clear existing timer
  if (saveTimer) {
    clearTimeout(saveTimer)
  }

  // Set new timer
  saveTimer = setTimeout(async () => {
    if (isDirty) {
      try {
        await saveDatabase()
        console.log('[DB] Auto-saved database')
      } catch (error) {
        console.error('[DB] Auto-save failed:', error)
      }
    }
  }, SAVE_DELAY)
}

/**
 * Initialize the auto-save interval
 */
export const startAutoSave = (): void => {
  // Clear existing interval if any
  if (saveInterval) {
    clearInterval(saveInterval)
  }

  // Set up periodic save (every 30 seconds max)
  saveInterval = setInterval(async () => {
    if (isDirty) {
      try {
        await saveDatabase()
        console.log('[DB] Periodic auto-saved database')
      } catch (error) {
        console.error('[DB] Periodic auto-save failed:', error)
      }
    }
  }, SAVE_INTERVAL)

  console.log('[DB] Auto-save started')
}

/**
 * Stop auto-save and perform final save
 */
export const stopAutoSave = async (): Promise<void> => {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }

  if (saveInterval) {
    clearInterval(saveInterval)
    saveInterval = null
  }

  // Final save before closing
  if (isDirty) {
    await saveDatabase()
    console.log('[DB] Final save before closing')
  }
}

export const getDb = (): Database => {
  if (!db) {
    const errorMessage = 'Database not initialized'
    console.error(errorMessage)
    throw new Error(errorMessage)
  }
  return db
}
