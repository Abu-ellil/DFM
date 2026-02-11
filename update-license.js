import { app } from 'electron'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const licenseKey = '7889-E633-0CF4-57F3-30D'
const factoryName = 'Demo Factory'
const machineId = 'BBD4A43C1EBC4692'

function updateLicenseFile() {
  try {
    const userDataPath = app.getPath('userData')
    const licenseFilePath = join(userDataPath, '.license')

    console.log('📝 Updating license file...')
    console.log(`User Data Path: ${userDataPath}`)
    console.log(`License File: ${licenseFilePath}`)
    console.log('')

    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 30)

    const licenseData = {
      machineId,
      licenseKey,
      factoryName,
      activatedAt: new Date().toISOString(),
      expiryDate: expiryDate.toISOString(),
      lastOnlineCheck: new Date().toISOString()
    }

    writeFileSync(licenseFilePath, JSON.stringify(licenseData, null, 2))
    console.log('✅ License file updated successfully!')
    console.log('')
    console.log('License Key:', licenseKey)
    console.log('Factory Name:', factoryName)
    console.log('Machine ID:', machineId)
    console.log('Expiry Date:', expiryDate.toISOString())
    console.log('')
    console.log('Restart the app to activate the license.')
  } catch (error) {
    console.error('❌ Error updating license file:', error)
    console.log('')
    console.log('You can manually activate the license in the app by entering:')
    console.log(licenseKey)
  }
}

updateLicenseFile()
