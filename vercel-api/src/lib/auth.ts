import type { VercelRequest } from '@vercel/node'
import * as jose from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only'
const secret = new TextEncoder().encode(JWT_SECRET)

/**
 * User roles
 */
export type UserRole = 'admin' | 'user' | 'manager' | 'worker'

/**
 * JWT Payload
 */
export interface JWTPayload {
  phone: string
  role: UserRole
  full_name?: string
}

/**
 * Sign a JWT token
 */
export async function signJWT(payload: JWTPayload): Promise<string> {
  return await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret)
}

/**
 * Verify a JWT token
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, secret)
    return payload as unknown as JWTPayload
  } catch (error) {
    return null
  }
}

/**
 * Authenticate request and return user payload
 */
export async function authenticateRequest(request: VercelRequest): Promise<JWTPayload> {
  const authHeader = request.headers['authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing or invalid token')
  }

  const token = authHeader.split(' ')[1]
  const payload = await verifyJWT(token)

  if (!payload) {
    throw new Error('Unauthorized: Invalid or expired token')
  }

  return payload
}

/**
 * Authenticate admin request
 */
export async function authenticateAdmin(request: VercelRequest): Promise<JWTPayload> {
  const payload = await authenticateRequest(request)
  if (payload.role !== 'admin') {
    throw new Error('Forbidden: Admin access required')
  }
  return payload
}

/**
 * License validation result
 */
export interface FactoryInfo {
  machineId: string
  licenseKey: string
  databaseName: string
  databaseUrl: string
  factoryName?: string
}

/**
 * Initialize license_keys table if it doesn't exist
 */
async function initializeLicenseTable(): Promise<void> {
  const { createNeonConnection } = await import('./neon.js')
  const sql = createNeonConnection(process.env.NEON_DATABASE_URL!)

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS license_keys (
        id SERIAL PRIMARY KEY,
        license_key VARCHAR(30) UNIQUE NOT NULL,
        machine_id VARCHAR(20) NOT NULL,
        factory_name VARCHAR(100),
        duration_code VARCHAR(5),
        expiry_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_license_keys_key ON license_keys(license_key)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_license_keys_machine_id ON license_keys(machine_id)
    `

    await sql`
      ALTER TABLE license_keys ALTER COLUMN license_key TYPE VARCHAR(30)
    `
  } catch (error) {
    console.error('Error initializing license_keys table:', error)
    throw error
  }
}

/**
 * Register a license key with its machine ID
 * This should be called when a license key is created in the admin panel
 */
export async function registerLicenseKey(params: {
  licenseKey: string
  machineId: string
  factoryName?: string
  durationCode?: string
  expiryDate?: Date
}): Promise<{ success: boolean; error?: string }> {
  try {
    await initializeLicenseTable()

    const { createNeonConnection } = await import('./neon.js')
    const sql = createNeonConnection(process.env.NEON_DATABASE_URL!)

    const result = await sql`
      SELECT license_key FROM license_keys WHERE license_key = ${params.licenseKey.toUpperCase()}
    `

    if (result.length === 0) {
      await sql`
        INSERT INTO license_keys (license_key, machine_id, factory_name, duration_code, expiry_date)
        VALUES (
          ${params.licenseKey.toUpperCase()},
          ${params.machineId},
          ${params.factoryName || null},
          ${params.durationCode || null},
          ${params.expiryDate || null}
        )
      `
    } else {
      await sql`
        UPDATE license_keys SET
          machine_id = ${params.machineId},
          factory_name = ${params.factoryName || null},
          duration_code = ${params.durationCode || null},
          expiry_date = ${params.expiryDate || null},
          updated_at = CURRENT_TIMESTAMP
        WHERE license_key = ${params.licenseKey.toUpperCase()}
      `
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error registering license key:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Validate license and return factory information
 * This middleware extracts the license key from the Authorization header
 * and maps it to the factory's Neon database
 */
export async function validateLicense(request: VercelRequest): Promise<FactoryInfo> {
  // Get license key from Authorization header
  const authHeader = request.headers['authorization']
  if (!authHeader) {
    throw new Error('Missing Authorization header')
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw new Error('Invalid Authorization format')
  }

  const licenseKey = authHeader.substring(7).trim()

  // Validate license key format
  const parts = licenseKey.split('-')
  if (parts.length !== 5) {
    throw new Error('Invalid license key format')
  }

  // Extract machine ID from license key
  // The license key format is: XXXX-XXXX-XXXX-XXXX-DD
  // The first 4 parts contain the machine ID (encoded)
  const machineId = await extractMachineIdFromLicense(licenseKey)

  // Construct database name and URL
  const databaseName = `dfm-${machineId}`
  const databaseUrl = process.env[`NEON_DB_${machineId}`] || constructNeonUrl(machineId)

  return {
    machineId,
    licenseKey,
    databaseName,
    databaseUrl,
    // Factory name is extracted from license (optional)
    factoryName: await extractFactoryName(licenseKey)
  }
}

/**
 * Extract machine ID from license key
 * This queries the database to get the machine ID for the given license key
 */
async function extractMachineIdFromLicense(licenseKey: string): Promise<string> {
  const { createNeonConnection } = await import('./neon.js')
  const sql = createNeonConnection(process.env.NEON_DATABASE_URL!)

  try {
    const result = await sql`
      SELECT machine_id, expiry_date
      FROM license_keys
      WHERE license_key = ${licenseKey.toUpperCase()}
      LIMIT 1
    `

    if (result.length === 0) {
      throw new Error('License key not found in database')
    }

    const license = result[0]

    // Check if license has expired
    if (license.expiry_date) {
      const expiryDate = new Date(license.expiry_date)
      const now = new Date()
      if (now > expiryDate) {
        throw new Error('License key has expired')
      }
    }

    return license.machine_id
  } catch (error: any) {
    console.error('Error extracting machine ID from license key:', error)
    throw error
  }
}

/**
 * Extract factory name from license key (if present)
 */
async function extractFactoryName(licenseKey: string): Promise<string | undefined> {
  const { createNeonConnection } = await import('./neon.js')
  const sql = createNeonConnection(process.env.NEON_DATABASE_URL!)

  try {
    const result = await sql`
      SELECT factory_name
      FROM license_keys
      WHERE license_key = ${licenseKey.toUpperCase()}
      LIMIT 1
    `

    if (result.length === 0) {
      return undefined
    }

    return result[0].factory_name || undefined
  } catch (error) {
    console.error('Error extracting factory name from license key:', error)
    return undefined
  }
}

/**
 * Construct Neon database URL
 * Uses environment variables or default Neon project format
 */
function constructNeonUrl(machineId: string): string {
  // Check if there's a default Neon database URL
  const defaultUrl = process.env.NEON_DATABASE_URL
  if (defaultUrl) {
    // If using a single database with schemas, append schema name
    return `${defaultUrl}?options=project%3D${process.env.NEON_PROJECT_ID}`
  }

  // Otherwise, use machine-specific database
  // Format: postgresql://user:password@host/database?options=project%3Dproject-id
  const projectId = process.env.NEON_PROJECT_ID
  const dbName = `dfm-${machineId}`

  if (!projectId) {
    throw new Error('NEON_PROJECT_ID not configured')
  }

  // Neon's connection string format
  return `postgresql://neondb_owner:${process.env.NEON_DB_PASSWORD}@ep-${projectId}.us-east-2.aws.neon.tech/${dbName}?sslmode=require`
}

/**
 * Middleware function for Vercel serverless functions
 * Validates license and adds factory info to request context
 */
export function withLicenseAuth(
  handler: (request: VercelRequest, response: any, factory: FactoryInfo) => Promise<any>
) {
  return async (request: VercelRequest, response: any): Promise<any> => {
    try {
      // Validate license
      const factory = await validateLicense(request)

      // Call the actual handler with factory info
      return await handler(request, response, factory)
    } catch (error: any) {
      console.error('License validation error:', error)

      // Return appropriate error response
      if (error.message.includes('Missing') || error.message.includes('Invalid')) {
        return response.status(401).json({
          success: false,
          error: error.message
        })
      }

      return response.status(500).json({
        success: false,
        error: 'License validation failed'
      })
    }
  }
}

/**
 * Validate license key format only (for quick checks)
 */
export function validateLicenseFormat(licenseKey: string): boolean {
  const parts = licenseKey.split('-')
  return parts.length === 5 && parts.every((part) => part.length === 4)
}
