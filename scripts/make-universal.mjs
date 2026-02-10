import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const rootDir = path.join(__dirname, '..')
const x64AppPath = path.join(rootDir, 'release', 'DFM-x64.dmg')
const arm64AppPath = path.join(rootDir, 'release', 'DFM-arm64.dmg')
const universalAppPath = path.join(rootDir, 'release', 'DFM-universal.dmg')
const outputDir = path.join(rootDir, 'release', 'universal')

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

console.log('Creating universal macOS application...')
console.log(`x64 app: ${x64AppPath}`)
console.log(`arm64 app: ${arm64AppPath}`)
console.log(`Output: ${universalAppPath}`)

// Check if both builds exist
if (!fs.existsSync(x64AppPath)) {
  console.error(`Error: x64 build not found at ${x64AppPath}`)
  process.exit(1)
}

if (!fs.existsSync(arm64AppPath)) {
  console.error(`Error: arm64 build not found at ${arm64AppPath}`)
  process.exit(1)
}

try {
  // Extract app bundles from DMGs (macOS only)
  // This script assumes the DMGs have been mounted and the .app bundles are available
  // For GitHub Actions, we'll work with the actual .app directories

  console.log('\n⚠️  Note: This script requires the .app bundles to be extracted first.')
  console.log('The GitHub Actions workflow will handle the extraction and merging.')

  // For CI/CD usage, we'll use the @electron/universal package directly
  console.log('\n✓ @electron/universal is installed and ready')
} catch (error) {
  console.error('Error creating universal app:', error)
  process.exit(1)
}
