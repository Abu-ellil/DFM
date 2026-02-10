/**
 * Create or promote an admin user in auth_users.
 *
 * Usage:
 *   node create-admin.js --phone 0500000001 --password "password123" \
 *     --full-name "Admin User" --factory "My Factory" --machine-id "WEB-ADMIN-001"
 */

import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'

dotenv.config()

function parseArgs(argv) {
  const args = {}
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i]
    if (!key.startsWith('--')) continue
    const value = argv[i + 1]
    if (!value || value.startsWith('--')) {
      args[key.slice(2)] = true
    } else {
      args[key.slice(2)] = value
      i++
    }
  }
  return args
}

function usage() {
  console.log('Usage:')
  console.log('  node create-admin.js --phone 0500000001 --password "password123" \\')
  console.log('    --full-name "Admin User" --factory "My Factory" --machine-id "WEB-ADMIN-001"')
}

async function main() {
  const args = parseArgs(process.argv)
  const phone = args.phone
  const password = args.password
  const fullName = args['full-name'] || null
  const factoryName = args.factory || null
  const machineId =
    args['machine-id'] || (phone ? `WEB-ADMIN-${phone}-${Math.random().toString(36).slice(2, 8)}` : null)

  if (!phone || !password) {
    usage()
    process.exit(1)
  }

  const databaseUrl = process.env.NEON_DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ Error: NEON_DATABASE_URL environment variable is not set')
    process.exit(1)
  }

  const sql = neon(databaseUrl, {
    fetchOptions: {
      cache: 'no-store'
    }
  })

  try {
    // Ensure required columns exist.
    await sql`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'`
    await sql`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'`

    const existing = await sql`SELECT id FROM auth_users WHERE phone = ${phone}`
    const hashedPassword = await bcrypt.hash(password, 10)

    if (existing.length > 0) {
      await sql`
        UPDATE auth_users
        SET password = ${hashedPassword},
            full_name = COALESCE(${fullName}, full_name),
            factory_name = COALESCE(${factoryName}, factory_name),
            role = 'admin',
            status = 'active'
        WHERE phone = ${phone}
      `
      console.log(`✅ Updated user ${phone} to admin`)
      return
    }

    await sql`
      INSERT INTO auth_users (phone, password, machine_id, full_name, factory_name, role, status)
      VALUES (${phone}, ${hashedPassword}, ${machineId}, ${fullName}, ${factoryName}, 'admin', 'active')
    `
    console.log(`✅ Created admin user ${phone}`)
  } catch (error) {
    console.error('❌ Failed to create admin user:', error)
    process.exit(1)
  }
}

main()
