/**
 * Database Seed Script for Dates Factory Manager (Import Version)
 *
 * This script populates the database with sample/demo data for testing purposes.
 * It imports the initializeFactorySchema function from src/lib/neon.ts
 *
 * Usage:
 *   node seed-database-import.js
 *
 * Environment variables required:
 *   NEON_DATABASE_URL - Your Neon database connection string
 */

import { neon } from '@neondatabase/serverless'
import { initializeFactorySchema } from './src/lib/neon.ts'
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
    // Initialize database schema using imported function
    console.log('📊 Initializing database schema...')
    await initializeFactorySchema(sql)
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
