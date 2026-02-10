/**
 * Create Admin Account Script - Simple Version
 *
 * This script creates an admin account in database.
 * Usage: node scripts/create-admin-simple.cjs
 */

const { neon } = require('@neondatabase/serverless')
const bcrypt = require('bcryptjs')

// Get database URL from environment
const databaseUrl = process.env.NEON_DATABASE_URL

if (!databaseUrl) {
  console.error('Error: NEON_DATABASE_URL environment variable is not set')
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
      console.log('\nTo create a new admin, please delete existing one first.')
      return
    }

    // Hash password
    console.log('🔒 Hashing password...')
    const hashedPassword = await bcrypt.hash('111111', 10)

    // Generate machine ID for admin
    const machineId = `ADMIN-01221089249-${Date.now()}`

    // Insert admin user
    console.log('📝 Creating admin user in database...')
    await sql`
      INSERT INTO auth_users (phone, password, machine_id, full_name, factory_name, role, status)
      VALUES ('01221089249', ${hashedPassword}, ${machineId}, 'Admin User', 'Admin Factory', 'admin', 'active')
    `

    console.log('\n✅ Admin account created successfully!')
    console.log('\n📋 Admin Details:')
    console.log(`   Phone: 01221089249`)
    console.log(`   Password: 111111`)
    console.log(`   Role: admin`)
    console.log(`   Status: active`)
    console.log(`   Machine ID: ${machineId}`)
    console.log('\n🌐 You can now login at: https://dfm-mu.vercel.app/login')
    console.log('\n⚠️  Please keep your credentials safe!')
    console.log('🔐 Use admin panel at: https://dfm-mu.vercel.app/admin')
  } catch (error) {
    console.error('❌ Error creating admin account:', error.message)
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

    // Create admin account
    await createAdminAccount()
  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

// Run the script
main()
