import type { VercelRequest, VercelResponse } from '@vercel/node'
import { authenticateAdmin } from '../../src/lib/auth.js'
import { createNeonConnection } from '../../src/lib/neon.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Protect this endpoint
    await authenticateAdmin(request)

    const sql = createNeonConnection(process.env.NEON_DATABASE_URL!)

    // Fetch licenses from database
    const licenses = await sql`
      SELECT id, license_key, machine_id, factory_name, expiry_date, created_at 
      FROM license_keys 
      ORDER BY created_at DESC
    `

    return response.status(200).json({
      success: true,
      licenses: licenses.map(l => ({
        id: l.id,
        license_key: l.license_key,
        machine_id: l.machine_id,
        factory_name: l.factory_name,
        expiry_date: l.expiry_date,
        status: new Date(l.expiry_date) > new Date() ? 'active' : 'expired',
        created_at: l.created_at
      }))
    })
  } catch (error: any) {
    console.error('Admin licenses error:', error)
    return response.status(error.message.includes('Forbidden') ? 403 : 401).json({
      success: false,
      error: error.message || 'Unauthorized'
    })
  }
}
