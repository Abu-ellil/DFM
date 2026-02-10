import type { VercelRequest, VercelResponse } from '@vercel/node'
import bcrypt from 'bcryptjs'

interface RegisterRequest {
  phone: string
  password: string
  machine_id: string
  full_name?: string
  factory_name?: string
}

/**
 * POST /api/auth/register
 *
 * Register a new user account with phone number and password
 *
 * Request body:
 * {
 *   phone: string,
 *   password: string,
 *   machine_id: string,
 *   full_name?: string,
 *   factory_name?: string
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
    const body = request.body as RegisterRequest

    // Support both phone (new) and email/username (old) if needed,
    // but the API now requires phone.
    const phone = body.phone
    const password = body.password
    let machine_id = body.machine_id

    // If machine_id is missing (e.g. from web), generate a placeholder
    if (!machine_id && phone && password) {
      machine_id = `WEB-${phone}-${Math.random().toString(36).substring(2, 10)}`
    }

    if (!phone || !password || !machine_id) {
      return response.status(400).json({
        success: false,
        error: 'Missing required fields: phone, password, machine_id'
      })
    }

    if (body.password.length < 6) {
      return response.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      })
    }

    const hashedPassword = await bcrypt.hash(body.password, 10)

    const { createNeonConnection } = await import('../../src/lib/neon.js')

    const sql = createNeonConnection(process.env.NEON_DATABASE_URL!)

    try {
      const existing = await sql`
        SELECT phone FROM auth_users WHERE phone = ${phone}
      `

      if (existing.length > 0) {
        return response.status(409).json({
          success: false,
          error: 'Phone number already registered'
        })
      }

      // Check if this is the first user to make them admin
      const userCount = await sql`
        SELECT count(*) as count FROM auth_users
      `
      const role = parseInt(userCount[0].count) === 0 ? 'admin' : 'user'

      await sql`
          INSERT INTO auth_users (phone, password, machine_id, full_name, factory_name, role)
          VALUES (${phone}, ${hashedPassword}, ${machine_id}, ${body.full_name || null}, ${body.factory_name || null}, ${role})
        `

      const { signJWT } = await import('../../src/lib/auth.js')
      const token = await signJWT({
        phone: phone,
        role: role as any,
        full_name: body.full_name
      })

      return response.status(201).json({
        success: true,
        message: 'Account created successfully',
        token,
        user: {
          phone: phone,
          full_name: body.full_name,
          factory_name: body.factory_name,
          machine_id: machine_id,
          role: role
        }
      })
    } catch (dbError: any) {
      if (dbError.message?.includes('auth_users') || dbError.message?.includes('relation')) {
        await sql`
          CREATE TABLE IF NOT EXISTS auth_users (
            id SERIAL PRIMARY KEY,
            phone VARCHAR(20) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            machine_id VARCHAR(50) NOT NULL,
            full_name VARCHAR(100),
            factory_name VARCHAR(100),
            role VARCHAR(20) DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `

        await sql`
          CREATE INDEX IF NOT EXISTS idx_auth_users_phone ON auth_users(phone)
        `

        await sql`
          CREATE INDEX IF NOT EXISTS idx_auth_users_machine_id ON auth_users(machine_id)
        `

        // First user ever registered in the new table is admin
        const role = 'admin'

        await sql`
          INSERT INTO auth_users (phone, password, machine_id, full_name, factory_name, role)
          VALUES (${body.phone}, ${hashedPassword}, ${body.machine_id}, ${body.full_name || null}, ${body.factory_name || null}, ${role})
        `

        const { signJWT } = await import('../../src/lib/auth.js')
        const token = await signJWT({
          phone: body.phone,
          role: role as any,
          full_name: body.full_name
        })

        return response.status(201).json({
          success: true,
          message: 'Account created successfully',
          token,
          user: {
            phone: body.phone,
            full_name: body.full_name,
            factory_name: body.factory_name,
            machine_id: body.machine_id,
            role: role
          }
        })
      }

      throw dbError
    }
  } catch (error: any) {
    console.error('Register error:', error)
    return response.status(500).json({
      success: false,
      error: error.message || 'Registration failed'
    })
  }
}
