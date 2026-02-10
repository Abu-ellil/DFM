import { neon } from '@neondatabase/serverless'
import crypto from 'crypto'
import dotenv from 'dotenv'

dotenv.config()

const SECRET_KEY = process.env.LICENSE_SECRET_KEY || 'DateFactory2024SecretKey#$%^&*()!@#'
const databaseUrl = process.env.NEON_DATABASE_URL

async function generateAndRegister(machineId, durationCode = '4D', factoryName = 'Trial User') {
  if (!machineId) {
    console.error('Error: Machine ID is required')
    console.log('Usage: node generate-trial-key.js <MACHINE_ID> [DURATION_CODE] [FACTORY_NAME]')
    return
  }

  const cleanMachineId = machineId.trim().toUpperCase()

  // 1. Generate License Key (matches src/main/license.ts logic)
  const data = cleanMachineId + '|' + durationCode + '|' + SECRET_KEY
  const hash = crypto.createHash('sha256').update(data).digest('hex').substring(0, 16).toUpperCase()

  const parts = []
  for (let i = 0; i < 4; i++) {
    parts.push(hash.substring(i * 4, (i + 1) * 4))
  }
  parts.push(durationCode)
  const licenseKey = parts.join('-')

  console.log(`\n--- License Generation ---`)
  console.log(`Machine ID:   ${cleanMachineId}`)
  console.log(`Duration:     ${durationCode}`)
  console.log(`License Key:  ${licenseKey}`)
  console.log(`Factory Name: ${factoryName}`)

  // 2. Register in Database
  if (!databaseUrl) {
    console.warn('\n⚠️  NEON_DATABASE_URL not set in .env. Skipping database registration.')
    console.log('You can still use the key locally in the desktop app.')
    return
  }

  try {
    const sql = neon(databaseUrl)

    // Calculate expiry date
    let days = 4
    if (durationCode.endsWith('D')) days = parseInt(durationCode)
    else if (durationCode.endsWith('Y')) days = parseInt(durationCode) * 365

    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + days)

    console.log(`\n--- Database Registration ---`)
    console.log(`Connecting to Neon database...`)

    const result = await sql`
      SELECT license_key FROM license_keys WHERE license_key = ${licenseKey}
    `

    if (result.length === 0) {
      await sql`
        INSERT INTO license_keys (license_key, machine_id, factory_name, duration_code, expiry_date)
        VALUES (
          ${licenseKey},
          ${cleanMachineId},
          ${factoryName},
          ${durationCode},
          ${expiryDate}
        )
      `
    } else {
      await sql`
        UPDATE license_keys SET
          machine_id = ${cleanMachineId},
          factory_name = ${factoryName},
          duration_code = ${durationCode},
          expiry_date = ${expiryDate},
          updated_at = CURRENT_TIMESTAMP
        WHERE license_key = ${licenseKey}
      `
    }

    console.log(`✅ License key registered successfully in database.`)
    console.log(`Expiry Date: ${expiryDate.toLocaleString()}`)
    console.log(`\nPaste this key into your desktop app: ${licenseKey}`)
  } catch (error) {
    console.error(`❌ Database error: ${error.message}`)
  }
}

// Get arguments from command line
const machineId = process.argv[2]
const durationCode = process.argv[3] || '4D'
const factoryName = process.argv[4] || 'Trial User'

generateAndRegister(machineId, durationCode, factoryName)
