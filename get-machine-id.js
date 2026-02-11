#!/usr/bin/env node

const crypto = require('crypto')

function getMachineId() {
  const os = require('os')
  const { execSync } = require('child_process')

  try {
    let id

    if (process.platform === 'win32') {
      id = execSync('wmic csproduct get uuid', { encoding: 'utf-8' })
        .toString()
        .split('\n')[1]
        .trim()
    } else if (process.platform === 'darwin') {
      id = execSync('ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID', {
        encoding: 'utf-8'
      })
        .toString()
        .split('=')[1]
        .trim()
        .replace(/"/g, '')
        .replace(/-/g, '')
    } else {
      id = execSync('cat /etc/machine-id 2>/dev/null || cat /var/lib/dbus/machine-id 2>/dev/null || dmidecode -s system-uuid 2>/dev/null', {
        encoding: 'utf-8'
      })
        .toString()
        .trim()
    }

    const hash = crypto.createHash('sha256').update(id).digest('hex')
    return hash.substring(0, 16).toUpperCase()
  } catch (error) {
    console.error('Error getting machine ID:', error)
    throw error
  }
}

try {
  const machineId = getMachineId()
  console.log('Your Machine ID:', machineId)
  console.log('')
  console.log('To generate a trial license, run:')
  console.log(`  node vercel-api/generate-trial-license.js ${machineId}`)
} catch (error) {
  console.error('Failed to get machine ID:', error.message)
  process.exit(1)
}
