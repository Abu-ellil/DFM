import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withLicenseAuth } from '../src/lib/auth.js'
import { createNeonConnection, getChangesSince, applyChange } from '../src/lib/neon.js'
import bcrypt from 'bcryptjs'

/**
 * Consolidated Sync API
 * Handles:
 * - GET /api/sync/status
 * - POST /api/sync/pull
 * - POST /api/sync/push
 * - POST /api/sync/full
 * - POST /api/sync/database-info
 * - POST /api/sync/restore
 */
export default async function handler(request: VercelRequest, response: VercelResponse) {
  const url = request.url || ''
  const op = url.split('/').pop()?.split('?')[0]

  // Public status endpoint
  if (op === 'status') {
    if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed' })
    return response.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      service: 'dates-factory-manager-sync-api'
    })
  }

  // Restore endpoint (uses phone/password auth)
  if (op === 'restore') {
    if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' })
    try {
      const { phone, password } = request.body
      if (!phone || !password) return response.status(400).json({ success: false, error: 'Missing credentials' })
      
      const sql = createNeonConnection(process.env.NEON_DATABASE_URL!)
      const users = await sql`SELECT phone, password, machine_id FROM auth_users WHERE phone = ${phone}`
      
      if (users.length === 0 || !(await bcrypt.compare(password, users[0].password))) {
        return response.status(401).json({ success: false, error: 'Invalid credentials' })
      }

      const machineId = users[0].machine_id
      const tables = ['customers', 'weighbridge', 'crates', 'finance', 'users']
      const allChanges: any[] = []

      for (const table of tables) {
        const records = await sql`SELECT * FROM ${sql(table)} WHERE _client_id = ${machineId} ORDER BY _version ASC`
        for (const record of records) {
          allChanges.push({
            operation: 'INSERT',
            table,
            record_id: record.id,
            data: record,
            client_timestamp: record._client_timestamp || Date.now()
          })
        }
      }

      return response.status(200).json({ success: true, data: allChanges, message: 'Data restored successfully' })
    } catch (error: any) {
      return response.status(500).json({ success: false, error: error.message })
    }
  }

  // Other endpoints use withLicenseAuth
  return withLicenseAuth(async (req, res, factory) => {
    try {
      const sql = createNeonConnection(factory.databaseUrl)
      const body = req.body
      const tables = ['customers', 'weighbridge', 'crates', 'finance', 'users', 'date_types', 'crate_types', 'daily_prices', 'supervisors']

      switch (op) {
        case 'pull': {
          const { last_sync_checkpoint } = body
          if (typeof last_sync_checkpoint !== 'number') return res.status(400).json({ success: false, error: 'Invalid checkpoint' })
          const changes = await getChangesSince(sql, tables, last_sync_checkpoint)
          return res.status(200).setHeader('Cache-Control', 'no-store').json({ success: true, changes, checkpoint: Date.now() })
        }

        case 'push': {
          const { changes, last_sync_checkpoint } = body
          if (!Array.isArray(changes)) return res.status(400).json({ success: false, error: 'Invalid changes' })
          
          let processed = 0, failed = 0
          for (const change of changes) {
            try {
              await applyChange(sql, { ...change, client_id: factory.machineId, client_timestamp: change.client_timestamp || Date.now() })
              processed++
            } catch (e) { failed++ }
          }

          let remoteChanges: any[] = []
          if (last_sync_checkpoint) remoteChanges = await getChangesSince(sql, ['customers', 'weighbridge', 'crates', 'finance', 'users'], last_sync_checkpoint)
          return res.status(200).json({ success: true, processed, failed, remote_changes: remoteChanges, new_checkpoint: Date.now() })
        }

        case 'full': {
          const { changes, last_sync_checkpoint } = body
          if (!Array.isArray(changes) || typeof last_sync_checkpoint !== 'number') return res.status(400).json({ success: false, error: 'Invalid parameters' })
          
          let processed = 0, failed = 0
          for (const change of changes) {
            try {
              await applyChange(sql, { ...change, client_id: factory.machineId, client_timestamp: change.client_timestamp || Date.now() })
              processed++
            } catch (e) { failed++ }
          }

          const remoteChanges = await getChangesSince(sql, tables, last_sync_checkpoint)
          return res.status(200).json({ success: true, processed, failed, remote_changes: remoteChanges, new_checkpoint: Date.now() })
        }

        case 'database-info': {
          let lastSync = null, syncStatus = 'connected'
          try {
            const result = await sql`SELECT _synced_at FROM customers WHERE _synced_at IS NOT NULL ORDER BY _synced_at DESC LIMIT 1`
            if (result.length > 0) lastSync = new Date(result[0]._synced_at).toISOString()
          } catch (e) { syncStatus = 'error' }
          return res.status(200).setHeader('Cache-Control', 'no-store, max-age=0').json({ success: true, machineId: factory.machineId, databaseName: factory.databaseName, lastSync, syncStatus })
        }

        default:
          return res.status(404).json({ error: 'Sync operation not found' })
      }
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message })
    }
  })(request, response)
}
