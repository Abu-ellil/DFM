import type { VercelRequest, VercelResponse } from '@vercel/node'
import bcrypt from 'bcryptjs'

interface LoginRequest {
  phone: string
  password: string
}

/**
 * POST /api/auth/login
 *
 * Authenticate user with phone number and password
 *
 * Request body:
 * {
 *   phone: string,
 *   password: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   message: string,
 *   user?: {
 *     phone: string,
 *     full_name: string,
 *     factory_name: string,
 *     machine_id: string
 *   }
 * }
 */
export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = request.body as LoginRequest

    if (!body.phone || !body.password) {
      return response.status(400).json({
        success: false,
        error: 'Missing required fields: phone, password'
      })
    }

    const { createNeonConnection } = await import('../../src/lib/neon.js')

    const sql = createNeonConnection(process.env.NEON_DATABASE_URL!)

    try {
      const users = await sql`
        SELECT phone, password, machine_id, full_name, factory_name
        FROM auth_users
        WHERE phone = ${body.phone}
      `

      if (users.length === 0) {
        return response.status(401).json({
          success: false,
          error: 'Invalid phone number or password'
        })
      }

      const user = users[0]

      const passwordMatch = await bcrypt.compare(body.password, user.password)

      if (!passwordMatch) {
        return response.status(401).json({
          success: false,
          error: 'Invalid phone number or password'
        })
      }

      return response.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          phone: user.phone,
          full_name: user.full_name,
          factory_name: user.factory_name,
          machine_id: user.machine_id
        }
      })
    } catch (dbError: any) {
      if (dbError.message?.includes('auth_users') || dbError.message?.includes('relation')) {
        return response.status(401).json({
          success: false,
          error: 'Invalid phone number or password'
        })
      }

      throw dbError
    }
  } catch (error: any) {
    console.error('Login error:', error)
    return response.status(500).json({
      success: false,
      error: error.message || 'Login failed'
    })
  }
}
