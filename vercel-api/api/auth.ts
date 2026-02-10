import type { VercelRequest, VercelResponse } from '@vercel/node'
import bcrypt from 'bcryptjs'

/**
 * Consolidated Auth API
 * Handles:
 * - POST /api/auth/login
 * - POST /api/auth/register
 */
export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const url = request.url || ''
  const op = url.split('/').pop()?.split('?')[0]
  const { createNeonConnection } = await import('../src/lib/neon.js')
  const sql = createNeonConnection(process.env.NEON_DATABASE_URL!)

  try {
    if (op === 'login') {
      const { phone, password } = request.body
      if (!phone || !password) return response.status(400).json({ success: false, error: 'Missing credentials' })

      const users = await sql`SELECT phone, password, machine_id, full_name, factory_name, role FROM auth_users WHERE phone = ${phone}`
      if (users.length === 0 || !(await bcrypt.compare(password, users[0].password))) {
        return response.status(401).json({ success: false, error: 'Invalid credentials' })
      }

      const user = users[0]
      const { signJWT } = await import('../src/lib/auth.js')
      const token = await signJWT({ phone: user.phone, role: user.role || 'user', full_name: user.full_name })

      return response.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: { phone: user.phone, full_name: user.full_name, factory_name: user.factory_name, machine_id: user.machine_id, role: user.role || 'user' }
      })
    }

    if (op === 'register') {
      const { phone, password, full_name, factory_name } = request.body
      let { machine_id } = request.body
      if (!machine_id && phone && password) machine_id = `WEB-${phone}-${Math.random().toString(36).substring(2, 10)}`

      if (!phone || !password || !machine_id) return response.status(400).json({ success: false, error: 'Missing required fields' })
      if (password.length < 6) return response.status(400).json({ success: false, error: 'Password too short' })

      const existing = await sql`SELECT phone FROM auth_users WHERE phone = ${phone}`
      if (existing.length > 0) return response.status(409).json({ success: false, error: 'Phone already registered' })

      const userCount = await sql`SELECT count(*) as count FROM auth_users`
      const role = parseInt(userCount[0].count) === 0 ? 'admin' : 'user'
      const hashedPassword = await bcrypt.hash(password, 10)

      await sql`INSERT INTO auth_users (phone, password, machine_id, full_name, factory_name, role) VALUES (${phone}, ${hashedPassword}, ${machine_id}, ${full_name || null}, ${factory_name || null}, ${role})`
      
      const { signJWT } = await import('../src/lib/auth.js')
      const token = await signJWT({ phone, role, full_name })

      return response.status(200).json({
        success: true,
        message: 'Registration successful',
        token,
        user: { phone, full_name, factory_name, machine_id, role }
      })
    }

    return response.status(404).json({ error: 'Auth operation not found' })
  } catch (error: any) {
    console.error('Auth API error:', error)
    return response.status(500).json({ success: false, error: error.message })
  }
}
