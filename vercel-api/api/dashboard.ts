import type { VercelRequest, VercelResponse } from '@vercel/node'
import { authenticateRequest } from '../src/lib/auth.js'
import { createNeonConnection } from '../src/lib/neon.js'

/**
 * Consolidated Dashboard API
 * Handles:
 * - GET /api/dashboard/stats
 */
export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const url = request.url || ''
  const op = url.split('/').pop()?.split('?')[0]

  try {
    if (op === 'stats') {
      const payload = await authenticateRequest(request)
      
      const mainSql = createNeonConnection(process.env.NEON_DATABASE_URL!)
      const users = await mainSql`
        SELECT machine_id FROM auth_users WHERE phone = ${payload.phone}
      `
      
      if (users.length === 0) {
        return response.status(404).json({ error: 'User not found' })
      }
      
      const machineId = users[0].machine_id
      if (!machineId) {
        return response.status(400).json({ error: 'User has no assigned machine/factory' })
      }

      const projectId = process.env.NEON_PROJECT_ID
      const dbPassword = process.env.NEON_DB_PASSWORD
      const factoryDbUrl = `postgresql://neondb_owner:${dbPassword}@ep-${projectId}.us-east-2.aws.neon.tech/dfm-${machineId}?sslmode=require`

      const factorySql = createNeonConnection(factoryDbUrl)

      const [customerCount, weighbridgeCount, crateCount, financeCount] = await Promise.all([
        factorySql`SELECT count(*) as count FROM customers`.catch(() => [{ count: 0 }]),
        factorySql`SELECT count(*) as count FROM weighbridge_records`.catch(() => [{ count: 0 }]),
        factorySql`SELECT count(*) as count FROM crates`.catch(() => [{ count: 0 }]),
        factorySql`SELECT count(*) as count FROM financial_records`.catch(() => [{ count: 0 }])
      ])

      return response.status(200).json({
        success: true,
        stats: {
          customers: parseInt(customerCount[0].count),
          weighbridge: parseInt(weighbridgeCount[0].count),
          crates: parseInt(crateCount[0].count),
          finance: parseInt(financeCount[0].count)
        }
      })
    }

    return response.status(404).json({ error: 'Dashboard operation not found' })
  } catch (error: any) {
    console.error('Dashboard API error:', error)
    return response.status(error.message?.includes('Unauthorized') ? 401 : 500).json({
      success: false,
      error: error.message || 'Failed to fetch dashboard data'
    })
  }
}
