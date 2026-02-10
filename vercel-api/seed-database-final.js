/**
 * Database Seed Script for Dates Factory Manager (Final Version)
 *
 * This script populates the database with sample/demo data for testing purposes.
 * It includes realistic data for customers, transactions, and other entities.
 *
 * Usage:
 *   node seed-database-final.js
 *
 * Environment variables required:
 *   NEON_DATABASE_URL - Your Neon database connection string
 */

import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

// Sample data for customers (Arabic names and companies)
const sampleCustomers = [
  { name: 'شركة النور للتجارة', type: 'شركة', phone: '0501234567' },
  { name: 'مؤسسة الأفق المحدودة', type: 'مؤسسة', phone: '0502345678' },
  { name: 'محمد أحمد العلي', type: 'فرد', phone: '0503456789' },
  { name: 'شركة البركة للتمور', type: 'شركة', phone: '0504567890' },
  { name: 'عبدالله سالم القحطاني', type: 'فرد', phone: '0505678901' },
  { name: 'مجموعة الخليج التجارية', type: 'شركة', phone: '0506789012' },
  { name: 'سعيد محمد الدوسري', type: 'فرد', phone: '0507890123' },
  { name: 'شركة الواحة للصناعات الغذائية', type: 'شركة', phone: '0508901234' },
  { name: 'فهد عبدالرحمن الشمري', type: 'فرد', phone: '0509012345' },
  { name: 'مؤسسة النخيل الذهبية', type: 'مؤسسة', phone: '0510123456' },
  { name: 'خالد يوسف الحربي', type: 'فرد', phone: '0511234567' },
  { name: 'شركة التمور السعودية', type: 'شركة', phone: '0512345678' },
  { name: 'عمر فاروق المطيري', type: 'فرد', phone: '0513456789' },
  { name: 'مؤسسة الفجر للتجارة', type: 'مؤسسة', phone: '0514567890' },
  { name: 'ناصر إبراهيم العتيبي', type: 'فرد', phone: '0515678901' }
]

// Sample date types
const sampleDateTypes = [
  { name: 'تمر سكري' },
  { name: 'تمر مجدول' },
  { name: 'تمر برحي' },
  { name: 'تمر خضري' },
  { name: 'تمر صفوي' },
  { name: 'تمر عجوة' },
  { name: 'تمر مبروم' },
  { name: 'تمر سوقي' }
]

// Sample crate types
const sampleCrateTypes = [
  { name: 'صندوق كبير', weight: 25.0, is_default: 1 },
  { name: 'صندوق متوسط', weight: 15.0, is_default: 0 },
  { name: 'صندوق صغير', weight: 10.0, is_default: 0 },
  { name: 'صندوق خاص', weight: 30.0, is_default: 0 }
]

// Sample supervisors
const sampleSupervisors = [
  { name: 'أحمد محمد' },
  { name: 'عبدالله علي' },
  { name: 'سعيد أحمد' },
  { name: 'محمد خالد' },
  { name: 'فهد سعود' }
]

// Helper function to generate random date within range
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0]
}

// Helper function to generate random integer
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Helper function to generate random float
function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n')

  // Check for database URL
  const databaseUrl = process.env.NEON_DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ Error: NEON_DATABASE_URL environment variable is not set')
    console.log('Please set it in your .env file or run:')
    console.log('  export NEON_DATABASE_URL="your-database-url"')
    process.exit(1)
  }

  // Create database connection
  const sql = neon(databaseUrl, {
    fetchOptions: {
      cache: 'no-store'
    }
  })

  try {
    // Initialize database schema
    console.log('📊 Initializing database schema...')
    await initializeSchema(sql)
    console.log('✅ Schema initialized successfully\n')

    // Seed data
    console.log('📝 Seeding data...\n')

    // Seed customers
    console.log('👥 Seeding customers...')
    const customerIds = await seedCustomers(sql)
    console.log(`✅ Inserted ${customerIds.length} customers\n`)

    // Seed date types
    console.log('📅 Seeding date types...')
    const dateTypeIds = await seedDateTypes(sql)
    console.log(`✅ Inserted ${dateTypeIds.length} date types\n`)

    // Seed crate types
    console.log('📦 Seeding crate types...')
    const crateTypeIds = await seedCrateTypes(sql)
    console.log(`✅ Inserted ${crateTypeIds.length} crate types\n`)

    // Seed supervisors
    console.log('👨‍💼 Seeding supervisors...')
    const supervisorIds = await seedSupervisors(sql)
    console.log(`✅ Inserted ${supervisorIds.length} supervisors\n`)

    // Seed daily prices
    console.log('💰 Seeding daily prices...')
    await seedDailyPrices(sql)
    console.log('✅ Inserted daily prices\n')

    // Seed weighbridge records
    console.log('⚖️ Seeding weighbridge records...')
    await seedWeighbridge(sql, customerIds, dateTypeIds)
    console.log('✅ Inserted weighbridge records\n')

    // Seed crates records
    console.log('📦 Seeding crates records...')
    await seedCrates(sql, customerIds, crateTypeIds)
    console.log('✅ Inserted crates records\n')

    // Seed finance records
    console.log('💳 Seeding finance records...')
    await seedFinance(sql, customerIds)
    console.log('✅ Inserted finance records\n')

    // Seed auth users
    console.log('🔐 Seeding auth users...')
    await seedAuthUsers(sql)
    console.log('✅ Inserted auth users\n')

    console.log('🎉 Database seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`   - Customers: ${customerIds.length}`)
    console.log(`   - Date Types: ${dateTypeIds.length}`)
    console.log(`   - Crate Types: ${crateTypeIds.length}`)
    console.log(`   - Supervisors: ${supervisorIds.length}`)
    console.log(`   - Daily Prices: 30 days`)
    console.log(`   - Weighbridge Records: ~50`)
    console.log(`   - Crates Records: ~40`)
    console.log(`   - Finance Records: ~60`)
    console.log(`   - Auth Users: 3`)
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    process.exit(1)
  }
}

async function initializeSchema(sql) {
  const tables = [
    // Customers table
    `CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      phone TEXT,
      _client_id TEXT,
      _synced_at INTEGER,
      _version INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Date Types table
    `CREATE TABLE IF NOT EXISTS date_types (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      _client_id TEXT,
      _synced_at INTEGER,
      _version INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Crate Types table
    `CREATE TABLE IF NOT EXISTS crate_types (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      weight REAL NOT NULL,
      is_default INTEGER DEFAULT 0,
      _client_id TEXT,
      _synced_at INTEGER,
      _version INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Daily prices table
    `CREATE TABLE IF NOT EXISTS daily_prices (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL UNIQUE,
      price_per_qantar REAL NOT NULL,
      qantar_weight REAL DEFAULT 100.0,
      _client_id TEXT,
      _synced_at INTEGER,
      _version INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Weighbridge table
    `CREATE TABLE IF NOT EXISTS weighbridge (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      date_type_id INTEGER REFERENCES date_types(id),
      gross_weight REAL DEFAULT 0,
      net_weight REAL NOT NULL,
      price_per_qantar REAL NOT NULL,
      total REAL NOT NULL,
      crates_count INTEGER DEFAULT 0,
      commission REAL DEFAULT 0,
      notes TEXT,
      _client_id TEXT,
      _synced_at INTEGER,
      _version INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Crates table
    `CREATE TABLE IF NOT EXISTS crates (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      crate_type_id INTEGER REFERENCES crate_types(id),
      crates_out INTEGER DEFAULT 0,
      crates_returned INTEGER DEFAULT 0,
      handler TEXT,
      notes TEXT,
      _client_id TEXT,
      _synced_at INTEGER,
      _version INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Finance table
    `CREATE TABLE IF NOT EXISTS finance (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      transaction_type TEXT NOT NULL,
      amount_paid REAL DEFAULT 0,
      amount_received REAL DEFAULT 0,
      notes TEXT,
      _client_id TEXT,
      _synced_at INTEGER,
      _version INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Supervisors table
    `CREATE TABLE IF NOT EXISTS supervisors (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      _client_id TEXT,
      _synced_at INTEGER,
      _version INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Auth users table
    `CREATE TABLE IF NOT EXISTS auth_users (
      id SERIAL PRIMARY KEY,
      phone VARCHAR(20) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      machine_id VARCHAR(50) NOT NULL,
      full_name VARCHAR(100),
      factory_name VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // License keys table
    `CREATE TABLE IF NOT EXISTS license_keys (
      id SERIAL PRIMARY KEY,
      license_key VARCHAR(20) UNIQUE NOT NULL,
      machine_id VARCHAR(20) NOT NULL,
      factory_name VARCHAR(100),
      duration_code VARCHAR(5),
      expiry_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ]

  // Create tables using the neon serverless client
  for (const createTableSQL of tables) {
    try {
      // Use a different approach: execute the SQL directly
      await sql`${createTableSQL}`
    } catch (error) {
      console.error('Failed to create table:', error.message)
    }
  }

  // Create indexes
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_weighbridge_customer_date ON weighbridge(customer_id, date)',
    'CREATE INDEX IF NOT EXISTS idx_finance_customer_date ON finance(customer_id, date)',
    'CREATE INDEX IF NOT EXISTS idx_crates_customer_date ON crates(customer_id, date)',
    'CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name)',
    'CREATE INDEX IF NOT EXISTS idx_auth_users_phone ON auth_users(phone)',
    'CREATE INDEX IF NOT EXISTS idx_license_keys_key ON license_keys(license_key)',
    'CREATE INDEX IF NOT EXISTS idx_license_keys_machine_id ON license_keys(machine_id)'
  ]

  for (const createIndexSQL of indexes) {
    try {
      await sql`${createIndexSQL}`
    } catch (error) {
      // Ignore index creation errors
    }
  }
}

async function seedCustomers(sql) {
  const ids = []
  for (const customer of sampleCustomers) {
    try {
      const result = await sql`
        INSERT INTO customers (name, type, phone, _client_id, _synced_at)
        VALUES (${customer.name}, ${customer.type}, ${customer.phone}, 'SEED-001', ${Date.now()})
        RETURNING id
      `
      if (result && result.length > 0) {
        ids.push(result[0].id)
      }
    } catch (error) {
      // Skip duplicate entries
    }
  }
  return ids
}

async function seedDateTypes(sql) {
  const ids = []
  for (const dateType of sampleDateTypes) {
    try {
      const result = await sql`
        INSERT INTO date_types (name, _client_id, _synced_at)
        VALUES (${dateType.name}, 'SEED-001', ${Date.now()})
        RETURNING id
      `
      if (result && result.length > 0) {
        ids.push(result[0].id)
      }
    } catch (error) {
      // Skip duplicate entries
    }
  }
  return ids
}

async function seedCrateTypes(sql) {
  const ids = []
  for (const crateType of sampleCrateTypes) {
    try {
      const result = await sql`
        INSERT INTO crate_types (name, weight, is_default, _client_id, _synced_at)
        VALUES (${crateType.name}, ${crateType.weight}, ${crateType.is_default}, 'SEED-001', ${Date.now()})
        RETURNING id
      `
      if (result && result.length > 0) {
        ids.push(result[0].id)
      }
    } catch (error) {
      // Skip duplicate entries
    }
  }
  return ids
}

async function seedSupervisors(sql) {
  const ids = []
  for (const supervisor of sampleSupervisors) {
    try {
      const result = await sql`
        INSERT INTO supervisors (name, _client_id, _synced_at)
        VALUES (${supervisor.name}, 'SEED-001', ${Date.now()})
        RETURNING id
      `
      if (result && result.length > 0) {
        ids.push(result[0].id)
      }
    } catch (error) {
      // Skip duplicate entries
    }
  }
  return ids
}

async function seedDailyPrices(sql) {
  const today = new Date()
  const basePrice = 150.0 // Base price per qantar

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    // Add some price variation
    const price = basePrice + randomFloat(-20, 20)

    try {
      await sql`
        INSERT INTO daily_prices (date, price_per_qantar, qantar_weight, _client_id, _synced_at)
        VALUES (${formatDate(date)}, ${price}, 100.0, 'SEED-001', ${Date.now()})
      `
    } catch (error) {
      // Skip duplicate entries
    }
  }
}

async function seedWeighbridge(sql, customerIds, dateTypeIds) {
  const today = new Date()

  for (let i = 0; i < 50; i++) {
    const date = randomDate(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), today)

    const customerId = customerIds[randomInt(0, customerIds.length - 1)]
    const dateTypeId = dateTypeIds[randomInt(0, dateTypeIds.length - 1)]

    const netWeight = randomFloat(1000, 5000)
    const pricePerQantar = randomFloat(130, 170)
    const total = (netWeight / 100) * pricePerQantar
    const cratesCount = randomInt(10, 100)

    try {
      await sql`
        INSERT INTO weighbridge (
          date, customer_id, date_type_id, gross_weight, net_weight, 
          price_per_qantar, total, crates_count, commission, notes,
          _client_id, _synced_at
        )
        VALUES (
          ${formatDate(date)}, ${customerId}, ${dateTypeId}, 
          ${netWeight + randomFloat(50, 200)}, ${netWeight}, 
          ${pricePerQantar}, ${total}, ${cratesCount}, 
          ${randomFloat(0, 50)}, ${'معاملة عادية'},
          'SEED-001', ${Date.now()}
        )
      `
    } catch (error) {
      // Skip errors
    }
  }
}

async function seedCrates(sql, customerIds, crateTypeIds) {
  const today = new Date()

  for (let i = 0; i < 40; i++) {
    const date = randomDate(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), today)

    const customerId = customerIds[randomInt(0, customerIds.length - 1)]
    const crateTypeId = crateTypeIds[randomInt(0, crateTypeIds.length - 1)]

    const cratesOut = randomInt(10, 200)
    const cratesReturned = randomInt(0, cratesOut)

    try {
      await sql`
        INSERT INTO crates (
          date, customer_id, crate_type_id, crates_out, crates_returned,
          handler, notes, _client_id, _synced_at
        )
        VALUES (
          ${formatDate(date)}, ${customerId}, ${crateTypeId}, 
          ${cratesOut}, ${cratesReturned},
          ${'أحمد محمد'}, ${'تسليم صناديق'},
          'SEED-001', ${Date.now()}
        )
      `
    } catch (error) {
      // Skip errors
    }
  }
}

async function seedFinance(sql, customerIds) {
  const today = new Date()
  const transactionTypes = ['دفع', 'استلام', 'سداد', 'خصم']

  for (let i = 0; i < 60; i++) {
    const date = randomDate(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), today)

    const customerId = customerIds[randomInt(0, customerIds.length - 1)]
    const transactionType = transactionTypes[randomInt(0, transactionTypes.length - 1)]

    let amountPaid = 0
    let amountReceived = 0

    if (transactionType === 'دفع' || transactionType === 'سداد') {
      amountPaid = randomFloat(1000, 20000)
    } else {
      amountReceived = randomFloat(1000, 20000)
    }

    try {
      await sql`
        INSERT INTO finance (
          date, customer_id, transaction_type, amount_paid, amount_received,
          notes, _client_id, _synced_at
        )
        VALUES (
          ${formatDate(date)}, ${customerId}, ${transactionType}, 
          ${amountPaid}, ${amountReceived},
          ${'معاملة مالية عادية'},
          'SEED-001', ${Date.now()}
        )
      `
    } catch (error) {
      // Skip errors
    }
  }
}

async function seedAuthUsers(sql) {
  // Create bcrypt hash for password "password123"
  const bcrypt = (await import('bcryptjs')).default
  const hashedPassword = await bcrypt.hash('password123', 10)

  const users = [
    {
      phone: '0500000001',
      password: hashedPassword,
      machine_id: 'TEST-MACHINE-001',
      full_name: 'مدير النظام',
      factory_name: 'مصنع التمور التجريبي'
    },
    {
      phone: '0500000002',
      password: hashedPassword,
      machine_id: 'TEST-MACHINE-002',
      full_name: 'أحمد المدير',
      factory_name: 'مصنع النخيل'
    },
    {
      phone: '0500000003',
      password: hashedPassword,
      machine_id: 'TEST-MACHINE-003',
      full_name: 'محمد المشرف',
      factory_name: 'مصنع الواحة'
    }
  ]

  for (const user of users) {
    try {
      await sql`
        INSERT INTO auth_users (phone, password, machine_id, full_name, factory_name)
        VALUES (${user.phone}, ${user.password}, ${user.machine_id}, ${user.full_name}, ${user.factory_name})
      `
    } catch (error) {
      // Skip duplicate entries
    }
  }
}

// Run the seed script
seedDatabase()
