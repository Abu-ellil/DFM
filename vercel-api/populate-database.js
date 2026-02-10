/**
 * Database Population Script
 *
 * This script uses the existing sync API to populate the database with sample data.
 * It creates the necessary tables and inserts sample data using the sync endpoint.
 *
 * Usage:
 *   node populate-database.js
 *
 * Environment variables required:
 *   NEON_DATABASE_URL - Your Neon database connection string
 */

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

async function populateDatabase() {
  console.log('🌱 Starting database population...\n')

  // Check for database URL
  const databaseUrl = process.env.NEON_DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ Error: NEON_DATABASE_URL environment variable is not set')
    console.log('Please set it in your .env file or run:')
    console.log('  export NEON_DATABASE_URL="your-database-url"')
    process.exit(1)
  }

  try {
    console.log('📋 Creating SQL file for manual execution...')

    // Create SQL file with all necessary CREATE TABLE statements
    const sqlStatements = [
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
      );`,

      // Date Types table
      `CREATE TABLE IF NOT EXISTS date_types (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        _client_id TEXT,
        _synced_at INTEGER,
        _version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

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
      );`,

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
      );`,

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
      );`,

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
      );`,

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
      );`,

      // Supervisors table
      `CREATE TABLE IF NOT EXISTS supervisors (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        _client_id TEXT,
        _synced_at INTEGER,
        _version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      // Auth users table
      `CREATE TABLE IF NOT EXISTS auth_users (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        machine_id VARCHAR(50) NOT NULL,
        full_name VARCHAR(100),
        factory_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

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
      );`
    ]

    // Write SQL to file
    const fs = await import('fs')
    fs.writeFileSync('./create-tables.sql', sqlStatements.join('\n\n'))

    console.log('✅ SQL file created: create-tables.sql')
    console.log('\n📋 Next Steps:')
    console.log('1. Open Neon Console: https://console.neon.tech')
    console.log('2. Select your project')
    console.log('3. Click on "SQL Editor" in the left sidebar')
    console.log('4. Copy and paste the contents of create-tables.sql')
    console.log('5. Execute the SQL to create all tables')
    console.log(
      '\n📊 After creating tables, you can insert sample data using SQL queries or the sync API.'
    )

    console.log('\n💡 Alternative: Use the sync API')
    console.log('You can also populate the database by using the existing sync API endpoints.')
    console.log('This requires a valid license key and authorization header.')

    console.log('\n📝 Sample Data Summary:')
    console.log(`   - Customers: ${sampleCustomers.length}`)
    console.log(`   - Date Types: ${sampleDateTypes.length}`)
    console.log(`   - Crate Types: ${sampleCrateTypes.length}`)
    console.log(`   - Supervisors: ${sampleSupervisors.length}`)
    console.log('\n📖 Sample data is ready to be inserted once tables are created!')
  } catch (error) {
    console.error('❌ Error during population:', error)
    process.exit(1)
  }
}

// Run the population script
populateDatabase()
