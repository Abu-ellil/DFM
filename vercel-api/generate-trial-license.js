#!/usr/bin/env node

const https = require('https')
const crypto = require('crypto')

const SECRET_KEY = 'DateFactory2026SecretKey'

function generateLicenseKey(machineId, durationCode = '4D') {
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

function registerLicenseKey(params) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(params)

    const options = {
      hostname: 'dates-factory-manager-cloud.vercel.app',
      port: 443,
      path: '/api/license/generate-trial',
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
  const machineId = args[0]
  const factoryName = args[1] || 'Trial User'
  const durationCode = args[2] || '4D'

  if (!machineId) {
    console.error('Usage: node generate-trial-license.js <machineId> [factoryName] [durationCode]')
    console.error('')
    console.error('Example:')
    console.error('  node generate-trial-license.js ABCDEF1234567890 "My Factory" 4D')
    console.error('')
    console.error('Duration codes: 4D (4 days), 7D (7 days), 30D (30 days), 1Y (1 year)')
    process.exit(1)
  }

  if (machineId.length !== 16) {
    console.error('Error: Machine ID must be exactly 16 characters')
    process.exit(1)
  }

  console.log('Generating trial license...')
  console.log(`  Machine ID: ${machineId}`)
  console.log(`  Factory Name: ${factoryName}`)
  console.log(`  Duration: ${durationCode}`)
  console.log('')

  try {
    const result = await registerLicenseKey({
      machineId,
      factoryName,
      durationCode
    })

    if (result.success) {
      console.log('')
      console.log('✓ Trial license generated successfully!')
      console.log('')
      console.log('License Details:')
      console.log(`  License Key: ${result.licenseKey}`)
      console.log(`  Machine ID: ${result.machineId}`)
      console.log(`  Expiry Date: ${result.expiryDate}`)
      console.log(`  Duration: ${result.durationCode}`)
      console.log('')
      console.log('You can now activate your app with this license key:')
      console.log(`  ${result.licenseKey}`)
      console.log('')
    } else {
      console.error('')
      console.error('✗ Failed to generate trial license')
      console.error(`Error: ${result.error}`)
      process.exit(1)
    }
  } catch (error) {
    console.error('')
    console.error('✗ Failed to generate trial license')
    console.error(`Error: ${error.message}`)
    process.exit(1)
  }
}

main()
