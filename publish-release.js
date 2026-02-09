const fs = require('fs')
const path = require('path')
const https = require('https')

// Configuration
const GITHUB_TOKEN =
  process.env.GITHUB_TOKEN ||
  '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'
const OWNER = 'Abu-ellil'
const REPO = 'DFM'

// Get version from package.json
const packageJson = require('./package.json')
const TAG = `v${packageJson.version}`
const VERSION = packageJson.version
const RELEASE_DIR = path.join(__dirname, 'release')

// Debug: Check repository access
async function checkRepoAccess() {
  const options = {
    hostname: 'api.github.com',
    path: `/repos/${OWNER}/${REPO}`,
    method: 'GET',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      'User-Agent': 'Node.js'
    }
  }

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        console.log(`Repository check status: ${res.statusCode}`)
        if (res.statusCode === 200) {
          const repoInfo = JSON.parse(data)
          console.log(`Repository: ${repoInfo.full_name}`)
          console.log(`Private: ${repoInfo.private}`)
          resolve(repoInfo)
        } else {
          console.error(`Error: ${data}`)
          reject(new Error(`Cannot access repository: ${res.statusCode}`))
        }
      })
    })
    req.on('error', reject)
    req.end()
  })
}

// Read release notes from CHANGELOG
function getReleaseNotes() {
  const changelogPath = path.join(__dirname, 'CHANGELOG.md')

  if (!fs.existsSync(changelogPath)) {
    return `Release ${TAG}`
  }

  const changelog = fs.readFileSync(changelogPath, 'utf8')

  // Extract the section for the current version (remove 'v' prefix for regex)
  const versionRegex = VERSION.replace(/\./g, '\\.')
  const versionSection = changelog.match(
    new RegExp(`\\[${versionRegex}\\]([\\s\\S]*?)(?=\\n## \\[|\\n---|$)`)
  )

  if (versionSection) {
    return `## ${TAG} Release${versionSection[1]}`
  }
  return `Release ${TAG}`
}

// Create GitHub release
async function createRelease() {
  const notes = getReleaseNotes()

  const releaseData = JSON.stringify({
    tag_name: TAG,
    name: TAG,
    body: notes,
    draft: false,
    prerelease: false
  })

  const options = {
    hostname: 'api.github.com',
    path: `/repos/${OWNER}/${REPO}/releases`,
    method: 'POST',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      'User-Agent': 'Node.js',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(releaseData)
    }
  }

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data))
        } else {
          reject(new Error(`Failed to create release: ${res.statusCode} - ${data}`))
        }
      })
    })

    req.on('error', reject)
    req.write(releaseData)
    req.end()
  })
}

// Upload asset to release
async function uploadAsset(releaseId, assetPath, assetName) {
  const stats = fs.statSync(assetPath)
  const fileSize = stats.size

  const options = {
    hostname: 'uploads.github.com',
    path: `/repos/${OWNER}/${REPO}/releases/${releaseId}/assets?name=${encodeURIComponent(assetName)}`,
    method: 'POST',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      'User-Agent': 'Node.js',
      'Content-Type': 'application/octet-stream',
      'Content-Length': fileSize
    }
  }

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✓ Uploaded: ${assetName}`)
          resolve(JSON.parse(data))
        } else {
          reject(new Error(`Failed to upload ${assetName}: ${res.statusCode} - ${data}`))
        }
      })
    })

    req.on('error', (error) => {
      console.error(`✗ Failed to upload ${assetName}:`, error.message)
      reject(error)
    })

    const fileStream = fs.createReadStream(assetPath)
    fileStream.pipe(req)
  })
}

// Get all build artifacts from release directory
function getBuildArtifacts() {
  const artifacts = []

  if (!fs.existsSync(RELEASE_DIR)) {
    console.warn(`⚠ Release directory not found: ${RELEASE_DIR}`)
    return artifacts
  }

  const files = fs.readdirSync(RELEASE_DIR)

  for (const file of files) {
    const filePath = path.join(RELEASE_DIR, file)
    const stat = fs.statSync(filePath)

    if (stat.isFile()) {
      // Include all build artifacts (exe, dmg, AppImage, deb, zip, blockmap, yml, yaml)
      if (file.match(/\.(exe|dmg|AppImage|deb|zip|blockmap|yml|yaml)$/i)) {
        artifacts.push({
          path: filePath,
          name: file
        })
      }
    }
  }

  return artifacts
}

// Main execution
async function main() {
  try {
    console.log(`Publishing release ${TAG}...`)
    console.log('')

    console.log('Checking repository access...')
    await checkRepoAccess()
    console.log('')

    console.log('Creating GitHub release...')
    const release = await createRelease()
    console.log(`✓ Release created: ${release.html_url}`)

    // Upload all build artifacts
    console.log('\nScanning for build artifacts...')
    const assets = getBuildArtifacts()

    if (assets.length === 0) {
      console.warn('⚠ No build artifacts found in release directory')
      console.warn(
        'Please build the project first using: npm run build && npm run build:win && npm run build:mac && npm run build:linux'
      )
    } else {
      console.log(`Found ${assets.length} artifact(s)\n`)

      for (const asset of assets) {
        if (fs.existsSync(asset.path)) {
          await uploadAsset(release.id, asset.path, asset.name)
        }
      }
    }

    console.log('\n✓ Release completed successfully!')
    console.log(`View release at: ${release.html_url}`)
  } catch (error) {
    console.error('\n✗ Error:', error.message)
    process.exit(1)
  }
}

main()
