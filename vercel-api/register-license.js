#!/usr/bin/env node

/**
 * Script to register a license key in the Vercel API database
 *
 * Usage:
 *   node register-license.js <licenseKey> <machineId> [factoryName] [durationCode] [expiryDate]
 *
 * Example:
 *   node register-license.js ABCD-1234-EFGH-5678-4D MYMACHINEID "My Factory" "4D" "2024-12-31T23:59:59Z"
 */

const https = require('https')

const API_BASE = 'https://dates-factory-manager-cloud.vercel.app/api'

function registerLicenseKey(params) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(params)

    const options = {
      hostname: 'dates-factory-manager-cloud.vercel.app',
      port: 443,
      path: '/api/license/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }

    const req = https.request(options, (res) => {
      let body = ''

      res.on('data', (chunk) => {
        body += chunk
      })

      res.on('end', () => {
        try {
          const response = JSON.parse(body)
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response)
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${response.error || 'Unknown error'}`))
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`))
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.write(data)
    req.end()
  })
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    console.error(
      'Usage: node register-license.js <licenseKey> <machineId> [factoryName] [durationCode] [expiryDate]'
    )
    console.error('')
    console.error('Arguments:')
    console.error('  licenseKey   - License key (format: XXXX-XXXX-XXXX-XXXX-DD)')
    console.error('  machineId    - Machine ID (16 characters)')
    console.error('  factoryName  - Factory name (optional)')
    console.error('  durationCode - Duration code (optional, e.g., "4D", "1Y")')
    console.error('  expiryDate   - Expiry date in ISO 8601 format (optional)')
    console.error('')
    console.error('Example:')
    console.error(
      '  node register-license.js ABCD-1234-EFGH-5678-4D MYMACHINEID "My Factory" "4D" "2024-12-31T23:59:59Z"'
    )
    process.exit(1)
  }

  const [licenseKey, machineId, factoryName, durationCode, expiryDate] = args

  console.log('Registering license key...')
  console.log(`  License Key: ${licenseKey}`)
  console.log(`  Machine ID: ${machineId}`)
  if (factoryName) console.log(`  Factory Name: ${factoryName}`)
  if (durationCode) console.log(`  Duration Code: ${durationCode}`)
  if (expiryDate) console.log(`  Expiry Date: ${expiryDate}`)

  try {
    const result = await registerLicenseKey({
      licenseKey,
      machineId,
      factoryName,
      durationCode,
      expiryDate
    })

    if (result.success) {
      console.log('')
      console.log('✓ License key registered successfully!')
      console.log('')
      console.log('You can now use this license key in your desktop app.')
    } else {
      console.error('')
      console.error('✗ Failed to register license key')
      console.error(`Error: ${result.error}`)
      process.exit(1)
    }
  } catch (error) {
    console.error('')
    console.error('✗ Failed to register license key')
    console.error(`Error: ${error.message}`)
    process.exit(1)
  }
}

main()
