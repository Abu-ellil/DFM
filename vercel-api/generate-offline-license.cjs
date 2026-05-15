#!/usr/bin/env node

const crypto = require('crypto')

const SECRET_KEY = 'DateFactory2024SecretKey#$%^&*()!@#'

function generateLicenseKey(machineId, durationCode = '4D') {
  const data = machineId + '|' + durationCode + '|' + SECRET_KEY
  const hash = crypto.createHash('sha256').update(data).digest('hex').substring(0, 16).toUpperCase()

  const parts = []
  for (let i = 0; i < 4; i++) {
    parts.push(hash.substring(i * 4, (i + 1) * 4))
  }
  parts.push(durationCode)
  return parts.join('-')
}

function calculateExpiryDate(durationCode) {
  const expiryDate = new Date()
  let days = 4
  
  if (durationCode.endsWith('D')) {
    days = parseInt(durationCode.replace('D', ''))
  } else if (durationCode.endsWith('Y')) {
    days = parseInt(durationCode.replace('Y', '')) * 365
  }
  
  expiryDate.setDate(expiryDate.getDate() + days)
  return expiryDate
}

async function main() {
  const machineId = '77E9479EB9F80639'
  const factoryName = 'Trial User'
  const durationCode = '30D'

  console.log('Generating license key...')
  console.log(`  Machine ID: ${machineId}`)
  console.log(`  Factory Name: ${factoryName}`)
  console.log(`  Duration: ${durationCode} (30 days)`)
  console.log('')

  const licenseKey = generateLicenseKey(machineId, durationCode)
  const expiryDate = calculateExpiryDate(durationCode)

  console.log('✓ License key generated successfully!')
  console.log('')
  console.log('License Details:')
  console.log(`  License Key: ${licenseKey}`)
  console.log(`  Machine ID: ${machineId}`)
  console.log(`  Expiry Date: ${expiryDate.toISOString()}`)
  console.log(`  Duration: ${durationCode}`)
  console.log('')
  console.log('Use this license key to activate your app:')
  console.log(`  ${licenseKey}`)
  console.log('')
  console.log('Note: This is a locally generated license key.')
  console.log('To register it in the cloud database, run:')
  console.log(`  node register-license-direct.js "${licenseKey}" "${machineId}" "${factoryName}" "${durationCode}"`)
}

main()
