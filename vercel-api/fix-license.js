import dotenv from 'dotenv'
import { neon } from '@neondatabase/serverless'
import crypto from 'crypto'

dotenv.config()

const databaseUrl = process.env.NEON_DATABASE_URL
if (!databaseUrl) {
  console.error('❌ Error: NEON_DATABASE_URL environment variable is not set')
  process.exit(1)
}

const SECRET_KEY = 'DateFactory2024SecretKey#$%^&*()!@#'
const machineId = 'BBD4A43C1EBC4692'

function generateLicenseKey(machineId, durationCode = '30D') {
  const data = machineId + '|' + durationCode + '|' + SECRET_KEY
  const hash = crypto
    .createHash('sha256')
    .update(data)
    .digest('hex')
    .substring(0, 16)
    .toUpperCase()

  const parts = []
  for (let i = 0; i < 4; i++) {
    parts.push(hash.substring(i * 4, (i + 1) * 4))
  }
  parts.push(durationCode)
  return parts.join('-')
}

async function main() {
  console.log('📝 Fixing license key with correct secret...\n')

  const sql = neon(databaseUrl)

  try {
    const licenseKey = generateLicenseKey(machineId, '30D')
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 30)

    console.log(`Machine ID: ${machineId}`)
    console.log(`License Key: ${licenseKey}`)
    console.log(`Factory Name: Demo Factory`)
    console.log(`Duration: 30D`)
    console.log(`Expiry Date: ${expiryDate.toISOString()}`)
    console.log('')

    const existing = await sql`
      SELECT * FROM license_keys WHERE machine_id = ${machineId}
    `

    if (existing.length > 0) {
      console.log('⚠️  Found existing license, updating...')
      await sql`
        UPDATE license_keys SET
          license_key = ${licenseKey.toUpperCase()},
          factory_name = 'Demo Factory',
          duration_code = '30D',
          expiry_date = ${expiryDate.toISOString()},
          updated_at = CURRENT_TIMESTAMP
        WHERE machine_id = ${machineId}
      `
    } else {
      console.log('➕ Inserting new license key...')
      await sql`
        INSERT INTO license_keys (license_key, machine_id, factory_name, duration_code, expiry_date)
        VALUES (${licenseKey.toUpperCase()}, ${machineId}, 'Demo Factory', '30D', ${expiryDate.toISOString()})
      `
    }

    console.log('')
    console.log('✅ License key fixed and registered successfully!')
    console.log('')
    console.log('Your license key is:', licenseKey)
    console.log('This key should now validate correctly in the app.')
  } catch (error) {
    console.error('❌ Error fixing license key:', error)
    process.exit(1)
  }
}

main()
