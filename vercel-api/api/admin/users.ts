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

    // Fetch users from database
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
        status: 'active', // You can add a status column to the table later
        created_at: u.created_at
      }))
    })
  } catch (error: any) {
    console.error('Admin users error:', error)
    return response.status(error.message.includes('Forbidden') ? 403 : 401).json({
      success: false,
      error: error.message || 'Unauthorized'
    })
  }
}
