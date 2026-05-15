#!/usr/bin/env node

const https = require('https')

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
  const [licenseKey, machineId, factoryName, durationCode, expiryDate] = args

  if (!licenseKey || !machineId) {
    console.error('Usage: node register-license-params.cjs <licenseKey> <machineId> [factoryName] [durationCode] [expiryDate]')
    console.error('')
    console.error('Example:')
    console.error('  node register-license-params.cjs ABCD-1234-EFGH-5678-30D MYMACHINEID "My Factory" "30D"')
    process.exit(1)
  }

  console.log('Registering license key...')
  console.log(`  License Key: ${licenseKey}`)
  console.log(`  Machine ID: ${machineId}`)
  if (factoryName) console.log(`  Factory Name: ${factoryName}`)
  if (durationCode) console.log(`  Duration Code: ${durationCode}`)
  if (expiryDate) console.log(`  Expiry Date: ${expiryDate}`)
  console.log('')

  try {
    const result = await registerLicenseKey({
      licenseKey,
      machineId,
      factoryName,
      durationCode,
      expiryDate
    })

    if (result.success) {
      console.log('✓ License key registered successfully!')
      console.log('')
      console.log('Your license key is now registered in the cloud database.')
      console.log('Cloud sync should now work.')
    } else {
      console.error('✗ Failed to register license key')
      console.error(`Error: ${result.error}`)
      process.exit(1)
    }
  } catch (error) {
    console.error('✗ Failed to register license key')
    console.error(`Error: ${error.message}`)
    console.error('')
    console.error('The license key was generated locally. You can still use it to activate the app.')
    console.error('However, cloud sync features may not work without registering it in the database.')
  }
}

main()
