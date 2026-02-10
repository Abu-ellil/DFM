import type { VercelRequest, VercelResponse } from '@vercel/node'
import bcrypt from 'bcryptjs'

interface RestoreRequest {
  phone: string
  password: string
}

interface SyncQueueItem {
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record_id: number
  data: Record<string, any>
  client_timestamp: number
}

/**
 * POST /api/sync/restore
 *
 * Restore user data from cloud database
 * Downloads all data associated with the user's machine_id
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
 *   data?: Array<SyncQueueItem>,
 *   message: string
 * }
 */
export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = request.body as RestoreRequest

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
        SELECT phone, password, machine_id
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

      const machineId = user.machine_id

      const tables = ['customers', 'weighbridge', 'crates', 'finance', 'users']
      const allChanges: SyncQueueItem[] = []

      for (const table of tables) {
        try {
          const records = await sql`
            SELECT * FROM ${sql(table)}
            WHERE _client_id = ${machineId}
            ORDER BY _version ASC
          `

          for (const record of records) {
            const clientTimestamp = record._client_timestamp || Date.now()

            allChanges.push({
              operation: 'INSERT',
              table: table,
              record_id: record.id,
              data: record,
              client_timestamp: clientTimestamp
            })
          }
        } catch (tableError: any) {
          console.log(`Table ${table} does not exist or is empty, skipping...`)
        }
      }

      return response.status(200).json({
        success: true,
        data: allChanges,
        message: 'Data restored successfully'
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
    console.error('Restore error:', error)
    return response.status(500).json({
      success: false,
      error: error.message || 'Restore failed'
    })
  }
}
