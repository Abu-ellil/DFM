/**
 * Check Existing Tables Script
 *
 * This script queries the database to see what tables exist.
 *
 * Usage:
 *   node check-tables.js
 */

import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

async function checkTables() {
  console.log('🔍 Checking existing tables...\n')

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
    // Check all tables in the database
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `

    console.log('📋 Existing tables:')
    if (tables.length === 0) {
      console.log('   No tables found in the database')
    } else {
      tables.forEach((t) => console.log(`   - ${t.table_name}`))
    }

    // Check counts for each expected table
    const expectedTables = [
      'customers',
      'date_types',
      'crate_types',
      'daily_prices',
      'weighbridge',
      'crates',
      'finance',
      'supervisors',
      'auth_users',
      'license_keys'
    ]

    console.log('\n📊 Table record counts:')
    for (const tableName of expectedTables) {
      try {
        const result = await sql`SELECT COUNT(*) as count FROM ${sql.unsafe(tableName)}`
        console.log(`   ${tableName}: ${result[0].count} records`)
      } catch (error) {
        console.log(`   ${tableName}: Table does not exist`)
      }
    }

    console.log('\n✅ Table check completed!')
  } catch (error) {
    console.error('❌ Error during table check:', error)
    process.exit(1)
  }
}

checkTables()
