import https from 'https'
import fs from 'fs'

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''
const OWNER = 'Abu-ellil'
const REPO = 'DFM'
const TAG = 'v1.1.9'

// Read release notes from CHANGELOG
function getReleaseNotes() {
  const changelogPath = './CHANGELOG.md'

  if (!fs.existsSync(changelogPath)) {
    return `Release ${TAG}`
  }

  const changelog = fs.readFileSync(changelogPath, 'utf8')

  // Extract the section for the current version
  const versionRegex = '1\\.1\\.9'
  const versionSection = changelog.match(
    new RegExp(`\\[${versionRegex}\\]([\\s\\S]*?)(?=\\n## \\[|\\n---|$)`)
  )

  if (versionSection) {
    return `## ${TAG} Release${versionSection[1]}`
  }
  return `Release ${TAG}`
}

// Create GitHub release
function createRelease() {
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

  const req = https.request(options, (res) => {
    let data = ''

    res.on('data', (chunk) => {
      data += chunk
    })

    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const release = JSON.parse(data)
        console.log(`✓ Release created successfully!`)
        console.log(`Release URL: ${release.html_url}`)
        console.log(`Tag: ${TAG}`)
      } else {
        console.error(`✗ Failed to create release: ${res.statusCode}`)
        console.error(`Response: ${data}`)
      }
    })
  })

  req.on('error', (error) => {
    console.error(`✗ Error: ${error.message}`)
  })

  req.write(releaseData)
  req.end()
}

console.log(`Creating GitHub release ${TAG}...`)
createRelease()
