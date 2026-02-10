import type { VercelRequest, VercelResponse } from '@vercel/node'
import { registerLicenseKey } from '../src/lib/auth.js'
import { neon } from '@neondatabase/serverless'

const databaseUrl = process.env.NEON_DATABASE_URL

/**
 * Consolidated License API
 * Handles:
 * - POST /api/license/register
 * - POST /api/license/verify
 */
export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const url = request.url || ''
  const op = url.split('/').pop()?.split('?')[0]

  try {
    if (op === 'verify') {
      const { licenseKey, machineId } = request.body

      if (!licenseKey || !machineId) {
        return response.status(400).json({ success: false, error: 'Missing required fields' })
      }

      const parts = licenseKey.split('-')
      if (parts.length !== 5) {
        return response.status(400).json({ success: false, error: 'Invalid license key format' })
      }

      if (!databaseUrl) {
        console.log('Database URL not configured, allowing offline verification')
        return response.json({ valid: true, offline: true, message: 'No database configured' })
      }

      try {
        const sql = neon(databaseUrl)

        const result = await sql`
          SELECT machine_id, expiry_date, duration_code, factory_name
          FROM license_keys
          WHERE license_key = ${licenseKey.toUpperCase()}
          LIMIT 1
        `

        if (result.length === 0) {
          console.log('License key not found in database:', licenseKey)
          return response.json({ valid: false, status: 'not_found', message: 'License key not found' })
        }

        const license = result[0]

        if (license.machine_id !== machineId) {
          console.log('Machine ID mismatch. Expected:', license.machine_id, 'Got:', machineId)
          return response.json({ valid: false, status: 'machine_mismatch', message: 'Machine ID does not match' })
        }

        if (license.expiry_date) {
          const expiryDate = new Date(license.expiry_date)
          const now = new Date()
          if (now > expiryDate) {
            console.log('License expired on:', expiryDate)
            return response.json({ valid: false, status: 'expired', message: 'License has expired' })
          }
        }

        console.log('License verified successfully:', licenseKey)
        return response.json({ 
          valid: true, 
          status: 'active', 
          machineId: license.machine_id,
          expiryDate: license.expiry_date,
          factoryName: license.factory_name,
          durationCode: license.duration_code
        })
      } catch (dbError) {
        console.error('Database verification error:', dbError)
        return response.json({ valid: true, offline: true, message: 'Database unavailable, allowing offline' })
      }
    }

    if (op === 'register') {
      const body = request.body
      if (!body.licenseKey || !body.machineId) {
        return response.status(400).json({ success: false, error: 'Missing required fields' })
      }

      const parts = body.licenseKey.split('-')
      if (parts.length !== 5 || !parts.every((part: string) => part.length === 4)) {
        return response.status(400).json({ success: false, error: 'Invalid license key format' })
      }

      let expiryDate: Date | undefined
      if (body.expiryDate) {
        expiryDate = new Date(body.expiryDate)
        if (isNaN(expiryDate.getTime())) return response.status(400).json({ success: false, error: 'Invalid expiry date' })
      }

      const result = await registerLicenseKey({
        licenseKey: body.licenseKey,
        machineId: body.machineId,
        factoryName: body.factoryName,
        durationCode: body.durationCode,
        expiryDate
      })

      if (result.success) {
        return response.status(201).json({ success: true, message: 'License key registered successfully' })
      } else {
        return response.status(500).json({ success: false, error: result.error || 'Failed to register license key' })
      }
    }

    return response.status(404).json({ error: 'License operation not found' })
  } catch (error: any) {
    console.error('License API error:', error)
    return response.status(500).json({ success: false, error: error.message || 'Internal server error' })
  }
}
