import type { VercelRequest, VercelResponse } from '@vercel/node'
import { registerLicenseKey } from '../src/lib/auth.js'
import { neon } from '@neondatabase/serverless'
import crypto from 'crypto'

const databaseUrl = process.env.NEON_DATABASE_URL
const SECRET_KEY = process.env.LICENSE_SECRET || 'DateFactory2024SecretKey#$%^&*()!@#'

/**
 * Consolidated License API
 * Handles:
 * - POST /api/license/register
 * - POST /api/license/verify
 * - POST /api/license/generate-trial
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
          return response.json({
            valid: false,
            status: 'not_found',
            message: 'License key not found'
          })
        }

        const license = result[0]

        if (license.machine_id !== machineId) {
          console.log('Machine ID mismatch. Expected:', license.machine_id, 'Got:', machineId)
          return response.json({
            valid: false,
            status: 'machine_mismatch',
            message: 'Machine ID does not match'
          })
        }

        if (license.expiry_date) {
          const expiryDate = new Date(license.expiry_date)
          const now = new Date()
          if (now > expiryDate) {
            console.log('License expired on:', expiryDate)
            return response.json({
              valid: false,
              status: 'expired',
              message: 'License has expired'
            })
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
        return response.json({
          valid: true,
          offline: true,
          message: 'Database unavailable, allowing offline'
        })
      }
    }

    if (op === 'generate-trial') {
      const { machineId, factoryName, durationCode = '4D' } = request.body

      if (!machineId) {
        return response.status(400).json({ success: false, error: 'Machine ID is required' })
      }

      const cleanMachineId = machineId.trim().toUpperCase()
      if (cleanMachineId.length !== 16) {
        return response
          .status(400)
          .json({ success: false, error: 'Machine ID must be 16 characters' })
      }

      const data = cleanMachineId + '|' + durationCode + '|' + SECRET_KEY
      const hash = crypto
        .createHash('sha256')
        .update(data)
        .digest('hex')
        .substring(0, 16)
        .toUpperCase()

      const parts = []
      for (let i = 0; i < 4; i++) {
        parts.push(hash.substring(i * 4, (i + 1) * 4))
      }
      parts.push(durationCode)
      const licenseKey = parts.join('-')

      let days = 4
      if (durationCode.endsWith('D')) days = parseInt(durationCode.replace('D', ''))
      else if (durationCode.endsWith('Y')) days = parseInt(durationCode.replace('Y', '')) * 365

      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + days)

      const result = await registerLicenseKey({
        licenseKey,
        machineId: cleanMachineId,
        factoryName: factoryName || 'Trial User',
        durationCode,
        expiryDate
      })

      if (result.success) {
        return response.status(201).json({
          success: true,
          licenseKey,
          machineId: cleanMachineId,
          expiryDate: expiryDate.toISOString(),
          durationCode,
          message: 'Trial license generated successfully'
        })
      } else {
        return response
          .status(500)
          .json({ success: false, error: result.error || 'Failed to generate trial license' })
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
        if (isNaN(expiryDate.getTime()))
          return response.status(400).json({ success: false, error: 'Invalid expiry date' })
      }

      const result = await registerLicenseKey({
        licenseKey: body.licenseKey,
        machineId: body.machineId,
        factoryName: body.factoryName,
        durationCode: body.durationCode,
        expiryDate
      })

      if (result.success) {
        return response
          .status(201)
          .json({ success: true, message: 'License key registered successfully' })
      } else {
        return response
          .status(500)
          .json({ success: false, error: result.error || 'Failed to register license key' })
      }
    }

    return response.status(404).json({ error: 'License operation not found' })
  } catch (error: any) {
    console.error('License API error:', error)
    return response
      .status(500)
      .json({ success: false, error: error.message || 'Internal server error' })
  }
}
