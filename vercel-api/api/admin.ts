import type { VercelRequest, VercelResponse } from '@vercel/node'
import { authenticateAdmin } from '../src/lib/auth.js'
import { createNeonConnection } from '../src/lib/neon.js'

/**
 * Consolidated Admin API
 * Handles:
 * - GET /api/admin/stats
 * - GET /api/admin/users
 * - GET /api/admin/licenses
 */
export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Protect this endpoint
    await authenticateAdmin(request)

    const url = request.url || ''
    const op = url.split('/').pop()?.split('?')[0]
    const sql = createNeonConnection(process.env.NEON_DATABASE_URL!)

    switch (op) {
      case 'stats': {
        const userCount = await sql`SELECT count(*) as count FROM auth_users`
        const licenseCount = await sql`SELECT count(*) as count FROM license_keys`
        const factoryCount = await sql`SELECT count(DISTINCT machine_id) as count FROM license_keys`

        return response.status(200).json({
          success: true,
          stats: {
            totalUsers: parseInt(userCount[0].count),
            activeLicenses: parseInt(licenseCount[0].count),
            totalFactories: parseInt(factoryCount[0].count),
            systemHealth: 'good'
          }
        })
      }

      case 'users': {
        const users = await sql`
          SELECT id, phone, full_name, factory_name, role, created_at 
          FROM auth_users 
          ORDER BY created_at DESC
        `
        return response.status(200).json({
          success: true,
          users: users.map(u => ({
            id: u.id,
            phone: u.phone,
            full_name: u.full_name,
            factory_name: u.factory_name,
            role: u.role,
            status: 'active',
            created_at: u.created_at
          }))
        })
      }

      case 'licenses': {
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
      }

      default:
        return response.status(404).json({ error: 'Admin operation not found' })
    }
  } catch (error: any) {
    console.error('Admin API error:', error)
    return response.status(error.message.includes('Forbidden') ? 403 : 401).json({
      success: false,
      error: error.message || 'Unauthorized'
    })
  }
}
