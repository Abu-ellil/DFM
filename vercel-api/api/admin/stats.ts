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

    // Fetch real stats from database
    const userCount = await sql`SELECT count(*) as count FROM auth_users`
    const licenseCount = await sql`SELECT count(*) as count FROM license_keys`
    // Assuming factories are derived from unique machine_ids in license_keys or auth_users
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
  } catch (error: any) {
    console.error('Admin stats error:', error)
    return response.status(error.message.includes('Forbidden') ? 403 : 401).json({
      success: false,
      error: error.message || 'Unauthorized'
    })
  }
}
