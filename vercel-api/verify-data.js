/**
 * Verify Data Script
 *
 * This script queries the database to verify that the sample data exists.
 *
 * Usage:
 *   node verify-data.js
 */

import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

async function verifyData() {
  console.log('🔍 Verifying database data...\n')

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
    // Check customers
    console.log('👥 Customers:')
    const customers = await sql`SELECT COUNT(*) as count FROM customers`
    console.log(`   Total: ${customers[0].count}`)
    const sampleCustomers = await sql`SELECT name, type, phone FROM customers LIMIT 5`
    sampleCustomers.forEach((c) => console.log(`   - ${c.name} (${c.type}): ${c.phone}`))

    // Check date types
    console.log('\n📅 Date Types:')
    const dateTypes = await sql`SELECT COUNT(*) as count FROM date_types`
    console.log(`   Total: ${dateTypes[0].count}`)
    const sampleDateTypes = await sql`SELECT name FROM date_types LIMIT 5`
    sampleDateTypes.forEach((d) => console.log(`   - ${d.name}`))

    // Check crate types
    console.log('\n📦 Crate Types:')
    const crateTypes = await sql`SELECT COUNT(*) as count FROM crate_types`
    console.log(`   Total: ${crateTypes[0].count}`)
    const sampleCrateTypes = await sql`SELECT name, weight FROM crate_types LIMIT 5`
    sampleCrateTypes.forEach((c) => console.log(`   - ${c.name}: ${c.weight} kg`))

    // Check supervisors
    console.log('\n👨‍💼 Supervisors:')
    const supervisors = await sql`SELECT COUNT(*) as count FROM supervisors`
    console.log(`   Total: ${supervisors[0].count}`)
    const sampleSupervisors = await sql`SELECT name FROM supervisors LIMIT 5`
    sampleSupervisors.forEach((s) => console.log(`   - ${s.name}`))

    // Check daily prices
    console.log('\n💰 Daily Prices:')
    const dailyPrices = await sql`SELECT COUNT(*) as count FROM daily_prices`
    console.log(`   Total: ${dailyPrices[0].count}`)
    const samplePrices =
      await sql`SELECT date, price_per_qantar FROM daily_prices ORDER BY date DESC LIMIT 5`
    samplePrices.forEach((p) =>
      console.log(`   - ${p.date}: ${p.price_per_qantar.toFixed(2)} SAR/qantar`)
    )

    // Check weighbridge
    console.log('\n⚖️ Weighbridge Records:')
    const weighbridge = await sql`SELECT COUNT(*) as count FROM weighbridge`
    console.log(`   Total: ${weighbridge[0].count}`)
    const sampleWeighbridge = await sql`
      SELECT w.date, c.name as customer_name, w.net_weight, w.total 
      FROM weighbridge w 
      JOIN customers c ON w.customer_id = c.id 
      ORDER BY w.date DESC 
      LIMIT 5
    `
    sampleWeighbridge.forEach((w) =>
      console.log(
        `   - ${w.date}: ${w.customer_name}, ${w.net_weight.toFixed(2)} kg, ${w.total.toFixed(2)} SAR`
      )
    )

    // Check crates
    console.log('\n📦 Crates Records:')
    const crates = await sql`SELECT COUNT(*) as count FROM crates`
    console.log(`   Total: ${crates[0].count}`)
    const sampleCrates = await sql`
      SELECT cr.date, c.name as customer_name, cr.crates_out, cr.crates_returned 
      FROM crates cr 
      JOIN customers c ON cr.customer_id = c.id 
      ORDER BY cr.date DESC 
      LIMIT 5
    `
    sampleCrates.forEach((cr) =>
      console.log(
        `   - ${cr.date}: ${cr.customer_name}, out: ${cr.crates_out}, returned: ${cr.crates_returned}`
      )
    )

    // Check finance
    console.log('\n💳 Finance Records:')
    const finance = await sql`SELECT COUNT(*) as count FROM finance`
    console.log(`   Total: ${finance[0].count}`)
    const sampleFinance = await sql`
      SELECT f.date, c.name as customer_name, f.transaction_type, f.amount_paid, f.amount_received 
      FROM finance f 
      JOIN customers c ON f.customer_id = c.id 
      ORDER BY f.date DESC 
      LIMIT 5
    `
    sampleFinance.forEach((f) => {
      const amount =
        f.amount_paid > 0
          ? `${f.amount_paid.toFixed(2)} SAR (paid)`
          : `${f.amount_received.toFixed(2)} SAR (received)`
      console.log(`   - ${f.date}: ${f.customer_name}, ${f.transaction_type}, ${amount}`)
    })

    // Check auth users
    console.log('\n🔐 Auth Users:')
    const authUsers = await sql`SELECT COUNT(*) as count FROM auth_users`
    console.log(`   Total: ${authUsers[0].count}`)
    const sampleAuthUsers = await sql`SELECT phone, full_name, factory_name FROM auth_users LIMIT 5`
    sampleAuthUsers.forEach((u) =>
      console.log(`   - ${u.phone}: ${u.full_name} (${u.factory_name})`)
    )

    console.log('\n✅ Data verification completed!')
  } catch (error) {
    console.error('❌ Error during verification:', error)
    process.exit(1)
  }
}

verifyData()
