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

      const [
        customerCount,
        weighbridgeCount,
        crateCount,
        financeCount,
        monthlyWeights,
        monthlyFinance,
        crateStats
      ] = await Promise.all([
        factorySql`SELECT count(*) as count FROM customers`.catch(() => [{ count: 0 }]),
        factorySql`SELECT count(*) as count FROM weighbridge`.catch(() => [{ count: 0 }]),
        factorySql`SELECT count(*) as count FROM crates`.catch(() => [{ count: 0 }]),
        factorySql`SELECT count(*) as count FROM finance`.catch(() => [{ count: 0 }]),
        factorySql`
          SELECT 
            TO_CHAR(date, 'YYYY-MM') as month, 
            SUM(net_weight) as total_weight 
          FROM weighbridge 
          GROUP BY TO_CHAR(date, 'YYYY-MM') 
          ORDER BY month DESC 
          LIMIT 6
        `.catch(() => []),
        factorySql`
          SELECT 
            TO_CHAR(date, 'YYYY-MM') as month, 
            SUM(amount_paid) as total_paid,
            SUM(amount_received) as total_received
          FROM finance 
          GROUP BY TO_CHAR(date, 'YYYY-MM') 
          ORDER BY month DESC 
          LIMIT 6
        `.catch(() => []),
        factorySql`
          SELECT 
            SUM(crates_out) as total_out,
            SUM(crates_returned) as total_returned
          FROM crates
        `.catch(() => [{ total_out: 0, total_returned: 0 }])
      ])

      return response.status(200).json({
        success: true,
        stats: {
          customers: parseInt(customerCount[0].count),
          weighbridge: parseInt(weighbridgeCount[0].count),
          crates: parseInt(crateCount[0].count),
          finance: parseInt(financeCount[0].count),
          charts: {
            weights: monthlyWeights,
            finance: monthlyFinance,
            crates: crateStats[0]
          }
        }
      })
    }

    if (op === 'activity') {
      const payload = await authenticateRequest(request)
      const { limit = 10 } = request.body || {}

      const mainSql = createNeonConnection(process.env.NEON_DATABASE_URL!)
      const users = await mainSql`
        SELECT machine_id FROM auth_users WHERE phone = ${payload.phone}
      `

      if (users.length === 0) {
        return response.status(404).json({ error: 'User not found' })
      }

      const machineId = users[0].machine_id
      const projectId = process.env.NEON_PROJECT_ID
      const dbPassword = process.env.NEON_DB_PASSWORD
      const factoryDbUrl = `postgresql://neondb_owner:${dbPassword}@ep-${projectId}.us-east-2.aws.neon.tech/dfm-${machineId}?sslmode=require`

      const factorySql = createNeonConnection(factoryDbUrl)

      // Fetch recent records from different tables as activity
      const [recentWeighbridge, recentFinance, recentCrates] = await Promise.all([
        factorySql`
          SELECT 'weighbridge' as type, date as timestamp, 'New weight record for customer ' || customer_id as message 
          FROM weighbridge ORDER BY created_at DESC LIMIT ${limit}
        `.catch(() => []),
        factorySql`
          SELECT 'finance' as type, date as timestamp, 'Finance transaction: ' || transaction_type as message 
          FROM finance ORDER BY created_at DESC LIMIT ${limit}
        `.catch(() => []),
        factorySql`
          SELECT 'crates' as type, date as timestamp, 'Crate movement for customer ' || customer_id as message 
          FROM crates ORDER BY created_at DESC LIMIT ${limit}
        `.catch(() => [])
      ])

      const activity = [...recentWeighbridge, ...recentFinance, ...recentCrates]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit)

      return response.status(200).json({
        success: true,
        activity
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
