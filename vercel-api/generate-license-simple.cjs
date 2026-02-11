#!/usr/bin/env node

const https = require('https')

const machineId = 'BBD4A43C1EBC4692'

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
  const factoryName = 'Demo Factory'
  const durationCode = '30D'

  console.log('Generating trial license...')
  console.log(`  Machine ID: ${machineId}`)
  console.log(`  Factory Name: ${factoryName}`)
  console.log(`  Duration: ${durationCode} (30 days)`)
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
      console.log('Your license has been registered in the cloud database.')
      console.log('Cloud sync should now work.')
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
