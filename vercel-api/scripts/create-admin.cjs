/**
 * Create Admin Account Script
 *
 * This script creates an admin account in the database.
 * Run this script to set up the initial admin user.
 *
 * Usage: node scripts/create-admin.js
 *
 * Environment variables needed:
 * - NEON_DATABASE_URL: Your Neon database connection string
 */

const { neon } = require('@neondatabase/serverless')
const bcrypt = require('bcryptjs')

// Get database URL from environment
const databaseUrl = process.env.NEON_DATABASE_URL

if (!databaseUrl) {
  console.error('Error: NEON_DATABASE_URL environment variable is not set')
  console.error('Please set it before running this script:')
  console.error('export NEON_DATABASE_URL="your-database-url"')
  process.exit(1)
}

// Create database connection
const sql = neon(databaseUrl)

/**
 * Create admin account
 */
async function createAdminAccount() {
  try {
    console.log('🔐 Creating admin account...')

    // Check if admin already exists
    const existingAdmins = await sql`
      SELECT id, phone FROM auth_users WHERE role = 'admin'
    `

    if (existingAdmins.length > 0) {
      console.log('⚠️  Admin account already exists:')
      existingAdmins.forEach((admin) => {
        console.log(`   - Phone: ${admin.phone}, ID: ${admin.id}`)
      })
      console.log('\nTo create a new admin, please delete the existing one first.')
      return
    }

    // Prompt for admin details
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const askQuestion = (question) => {
      return new Promise((resolve) => {
        rl.question(question, (answer) => {
          resolve(answer)
        })
      })
    }

    console.log('\nPlease enter admin account details:')
    const phone = await askQuestion('Phone number: ')
    const password = await askQuestion('Password (min 6 characters): ')
    const fullName = await askQuestion('Full name (optional, press Enter to skip): ')
    const factoryName = await askQuestion('Factory name (optional, press Enter to skip): ')

    rl.close()

    // Validate input
    if (!phone || !password) {
      console.error('❌ Error: Phone and password are required')
      process.exit(1)
    }

    if (password.length < 6) {
      console.error('❌ Error: Password must be at least 6 characters')
      process.exit(1)
    }

    // Hash password
    console.log('\n🔒 Hashing password...')
    const hashedPassword = await bcrypt.hash(password, 10)

    // Generate machine ID for admin
    const machineId = `ADMIN-${phone.replace(/[^0-9]/g, '')}-${Date.now()}`

    // Insert admin user
    console.log('📝 Creating admin user in database...')
    await sql`
      INSERT INTO auth_users (phone, password, machine_id, full_name, factory_name, role, status)
      VALUES (${phone}, ${hashedPassword}, ${machineId}, ${fullName || null}, ${factoryName || null}, 'admin', 'active')
    `

    console.log('\n✅ Admin account created successfully!')
    console.log('\n📋 Admin Details:')
    console.log(`   Phone: ${phone}`)
    console.log(`   Role: admin`)
    console.log(`   Status: active`)
    console.log(`   Machine ID: ${machineId}`)
    console.log('\n🌐 You can now login at: https://your-domain.com/login')
    console.log('\n⚠️  Please keep your credentials safe!')
    console.log('🔐 Use the admin panel at: https://your-domain.com/admin')
  } catch (error) {
    console.error('❌ Error creating admin account:', error.message)
    process.exit(1)
  }
}

/**
 * Initialize database tables if they don't exist
 */
async function initializeTables() {
  try {
    console.log('🗄️  Checking database tables...')

    // Create auth_users table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS auth_users (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        machine_id VARCHAR(50),
        full_name VARCHAR(100),
        factory_name VARCHAR(100),
        role VARCHAR(20) DEFAULT 'user',
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    console.log('✅ Database tables ready')
  } catch (error) {
    console.error('❌ Error initializing database tables:', error.message)
    process.exit(1)
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 Admin Account Creation Script')
    console.log('================================\n')

    // Initialize tables
    await initializeTables()

    // Create admin account
    await createAdminAccount()
  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

// Run the script
main()
