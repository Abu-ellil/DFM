import type { VercelRequest, VercelResponse } from '@vercel/node'
import { registerLicenseKey } from '../src/lib/auth.js'

/**
 * Consolidated License API
 * Handles:
 * - POST /api/license/register
 */
export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const url = request.url || ''
  const op = url.split('/').pop()?.split('?')[0]

  try {
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
