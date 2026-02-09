import type { VercelRequest, VercelResponse } from '@vercel/node'
import { registerLicenseKey } from '../../src/lib/auth.js'

interface RegisterLicenseRequest {
  licenseKey: string
  machineId: string
  factoryName?: string
  durationCode?: string
  expiryDate?: string
}

/**
 * POST /api/license/register
 *
 * Register a license key with its machine ID
 * This endpoint should be called by the admin panel when creating a license key
 *
 * Request body:
 * {
 *   licenseKey: string,
 *   machineId: string,
 *   factoryName?: string,
 *   durationCode?: string,
 *   expiryDate?: string (ISO 8601 format)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   message: string
 * }
 */
export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = request.body as RegisterLicenseRequest

    if (!body.licenseKey || !body.machineId) {
      return response.status(400).json({
        success: false,
        error: 'Missing required fields: licenseKey, machineId'
      })
    }

    // Validate license key format
    const parts = body.licenseKey.split('-')
    if (parts.length !== 5 || !parts.every((part) => part.length === 4)) {
      return response.status(400).json({
        success: false,
        error: 'Invalid license key format. Expected format: XXXX-XXXX-XXXX-XXXX-DD'
      })
    }

    // Parse expiry date if provided
    let expiryDate: Date | undefined
    if (body.expiryDate) {
      expiryDate = new Date(body.expiryDate)
      if (isNaN(expiryDate.getTime())) {
        return response.status(400).json({
          success: false,
          error: 'Invalid expiry date format'
        })
      }
    }

    const result = await registerLicenseKey({
      licenseKey: body.licenseKey,
      machineId: body.machineId,
      factoryName: body.factoryName,
      durationCode: body.durationCode,
      expiryDate
    })

    if (result.success) {
      return response.status(201).json({
        success: true,
        message: 'License key registered successfully'
      })
    } else {
      return response.status(500).json({
        success: false,
        error: result.error || 'Failed to register license key'
      })
    }
  } catch (error: any) {
    console.error('License registration error:', error)
    return response.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    })
  }
}
