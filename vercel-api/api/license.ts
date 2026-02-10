import type { VercelRequest, VercelResponse } from '@vercel/node'
import { registerLicenseKey } from '../src/lib/auth.js'
import crypto from 'crypto'

const SECRET_KEY = process.env.LICENSE_SECRET || 'DateFactory2026SecretKey'

/**
 * Consolidated License API
 * Handles:
 * - POST /api/license/register
 * - POST /api/license/generate-trial
 */
export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const url = request.url || ''
  const op = url.split('/').pop()?.split('?')[0]

  try {
    if (op === 'generate-trial') {
      const { machineId, factoryName, durationCode = '4D' } = request.body

      if (!machineId) {
        return response.status(400).json({ success: false, error: 'Machine ID is required' })
      }

      // Clean and validate machine ID
      const cleanMachineId = machineId.trim().toUpperCase()
      if (cleanMachineId.length !== 16) {
        return response.status(400).json({ success: false, error: 'Machine ID must be 16 characters' })
      }

      // Generate license key
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

      // Calculate expiry date
      let days = 4
      if (durationCode.endsWith('D')) days = parseInt(durationCode.replace('D', ''))
      else if (durationCode.endsWith('Y')) days = parseInt(durationCode.replace('Y', '')) * 365

      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + days)

      // Register in database
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
        return response.status(500).json({ success: false, error: result.error || 'Failed to generate trial license' })
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
