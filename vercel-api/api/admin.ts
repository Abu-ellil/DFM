import type { VercelRequest, VercelResponse } from '@vercel/node'
import { authenticateAdmin } from '../src/lib/auth.js'
import { createNeonConnection } from '../src/lib/neon.js'

/**
 * Consolidated Admin API
 * Handles:
 * - GET /api/admin/stats
 * - GET /api/admin/users
 * - POST /api/admin/users (create user)
 * - PUT /api/admin/users/:id (update user)
 * - DELETE /api/admin/users/:id (delete user)
 * - POST /api/admin/users/:id/activate (activate user)
 * - POST /api/admin/users/:id/deactivate (deactivate user)
 * - POST /api/admin/users/:id/ban (ban user)
 * - GET /api/admin/licenses
 * - POST /api/admin/licenses (generate license)
 * - DELETE /api/admin/licenses/:id (delete license)
 * - POST /api/admin/licenses/:id/activate (activate license)
 * - POST /api/admin/licenses/:id/deactivate (deactivate license)
 * - POST /api/admin/licenses/:id/ban (ban license)
 */
export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    // Protect this endpoint for all methods except some public ones
    if (
      request.method !== 'GET' &&
      request.method !== 'POST' &&
      request.method !== 'PUT' &&
      request.method !== 'DELETE'
    ) {
      return response.status(405).json({ error: 'Method not allowed' })
    }

    // Protect admin endpoints
    await authenticateAdmin(request)

    const url = request.url || ''
    const pathParts = url.split('/').filter(Boolean)
    const sql = createNeonConnection(process.env.NEON_DATABASE_URL!)

    // Route based on URL path
    if (pathParts.includes('stats')) {
      return await handleStats(request, response, sql)
    }

    if (pathParts.includes('users')) {
      return await handleUsers(request, response, sql, pathParts)
    }

    if (pathParts.includes('licenses')) {
      return await handleLicenses(request, response, sql, pathParts)
    }

    return response.status(404).json({ error: 'Admin operation not found' })
  } catch (error: any) {
    console.error('Admin API error:', error)
    return response.status(error.message.includes('Forbidden') ? 403 : 401).json({
      success: false,
      error: error.message || 'Unauthorized'
    })
  }
}

async function handleStats(request: VercelRequest, response: VercelResponse, sql: any) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const userCount = await sql`SELECT count(*) as count FROM auth_users`
  const licenseCount = await sql`SELECT count(*) as count FROM license_keys`
  const factoryCount = await sql`SELECT count(DISTINCT machine_id) as count FROM license_keys`
  const activeLicenses =
    await sql`SELECT count(*) as count FROM license_keys WHERE expiry_date > NOW()`

  return response.status(200).json({
    success: true,
    stats: {
      totalUsers: parseInt(userCount[0].count),
      totalLicenses: parseInt(licenseCount[0].count),
      activeLicenses: parseInt(activeLicenses[0].count),
      totalFactories: parseInt(factoryCount[0].count),
      systemHealth: 'good'
    }
  })
}

async function handleUsers(
  request: VercelRequest,
  response: VercelResponse,
  sql: any,
  pathParts: string[]
) {
  const userId = pathParts[3] // /api/admin/users/:id

  // GET /api/admin/users
  if (request.method === 'GET' && !userId) {
    const users = await sql`
      SELECT id, phone, full_name, factory_name, role, status, created_at 
      FROM auth_users 
      ORDER BY created_at DESC
    `
    return response.status(200).json({
      success: true,
      users: users.map((u: any) => ({
        id: u.id,
        phone: u.phone,
        full_name: u.full_name,
        factory_name: u.factory_name,
        role: u.role,
        status: u.status || 'active',
        created_at: u.created_at
      }))
    })
  }

  // POST /api/admin/users (create user)
  if (request.method === 'POST' && !userId) {
    const { phone, password, full_name, factory_name, role } = request.body
    if (!phone || !password) {
      return response.status(400).json({ success: false, error: 'Missing required fields' })
    }

    const bcrypt = await import('bcryptjs')
    const hashedPassword = await bcrypt.hash(password, 10)

    await sql`
      INSERT INTO auth_users (phone, password, full_name, factory_name, role, status)
      VALUES (${phone}, ${hashedPassword}, ${full_name || null}, ${factory_name || null}, ${role || 'user'}, 'active')
    `

    return response.status(201).json({ success: true, message: 'User created successfully' })
  }

  // PUT /api/admin/users/:id (update user)
  if (request.method === 'PUT' && userId) {
    const { full_name, factory_name, role } = request.body

    await sql`
      UPDATE auth_users 
      SET full_name = COALESCE(${full_name}, full_name),
          factory_name = COALESCE(${factory_name}, factory_name),
          role = COALESCE(${role}, role)
      WHERE id = ${parseInt(userId)}
    `

    return response.status(200).json({ success: true, message: 'User updated successfully' })
  }

  // DELETE /api/admin/users/:id (delete user)
  if (request.method === 'DELETE' && userId) {
    await sql`DELETE FROM auth_users WHERE id = ${parseInt(userId)}`
    return response.status(200).json({ success: true, message: 'User deleted successfully' })
  }

  // POST /api/admin/users/:id/activate
  if (request.method === 'POST' && userId && pathParts[4] === 'activate') {
    await sql`UPDATE auth_users SET status = 'active' WHERE id = ${parseInt(userId)}`
    return response.status(200).json({ success: true, message: 'User activated successfully' })
  }

  // POST /api/admin/users/:id/deactivate
  if (request.method === 'POST' && userId && pathParts[4] === 'deactivate') {
    await sql`UPDATE auth_users SET status = 'inactive' WHERE id = ${parseInt(userId)}`
    return response.status(200).json({ success: true, message: 'User deactivated successfully' })
  }

  // POST /api/admin/users/:id/ban
  if (request.method === 'POST' && userId && pathParts[4] === 'ban') {
    await sql`UPDATE auth_users SET status = 'banned' WHERE id = ${parseInt(userId)}`
    return response.status(200).json({ success: true, message: 'User banned successfully' })
  }

  return response.status(404).json({ error: 'User operation not found' })
}

async function handleLicenses(
  request: VercelRequest,
  response: VercelResponse,
  sql: any,
  pathParts: string[]
) {
  const licenseId = pathParts[3] // /api/admin/licenses/:id

  // GET /api/admin/licenses
  if (request.method === 'GET' && !licenseId) {
    const licenses = await sql`
      SELECT id, license_key, machine_id, factory_name, expiry_date, status, created_at 
      FROM license_keys 
      ORDER BY created_at DESC
    `
    return response.status(200).json({
      success: true,
      licenses: licenses.map((l: any) => ({
        id: l.id,
        license_key: l.license_key,
        machine_id: l.machine_id,
        factory_name: l.factory_name,
        expiry_date: l.expiry_date,
        status: l.status || (new Date(l.expiry_date) > new Date() ? 'active' : 'expired'),
        created_at: l.created_at
      }))
    })
  }

  // POST /api/admin/licenses (generate license)
  if (request.method === 'POST' && !licenseId) {
    const { license_key, machine_id, factory_name, duration_code, expiry_date } = request.body
    if (!license_key || !machine_id) {
      return response.status(400).json({ success: false, error: 'Missing required fields' })
    }

    await sql`
      INSERT INTO license_keys (license_key, machine_id, factory_name, duration_code, expiry_date, status)
      VALUES (${license_key.toUpperCase()}, ${machine_id}, ${factory_name || null}, ${duration_code || null}, ${expiry_date || null}, 'active')
    `

    return response.status(201).json({ success: true, message: 'License generated successfully' })
  }

  // DELETE /api/admin/licenses/:id (delete license)
  if (request.method === 'DELETE' && licenseId) {
    await sql`DELETE FROM license_keys WHERE id = ${parseInt(licenseId)}`
    return response.status(200).json({ success: true, message: 'License deleted successfully' })
  }

  // PUT /api/admin/licenses/:id (update license)
  if (request.method === 'PUT' && licenseId) {
    const { factory_name, machine_id, expiry_date, status } = request.body

    await sql`
      UPDATE license_keys 
      SET factory_name = COALESCE(${factory_name}, factory_name),
          machine_id = COALESCE(${machine_id}, machine_id),
          expiry_date = COALESCE(${expiry_date}, expiry_date),
          status = COALESCE(${status}, status)
      WHERE id = ${parseInt(licenseId)}
    `

    return response.status(200).json({ success: true, message: 'License updated successfully' })
  }

  // POST /api/admin/licenses/:id/activate
  if (request.method === 'POST' && licenseId && pathParts[4] === 'activate') {
    await sql`UPDATE license_keys SET status = 'active' WHERE id = ${parseInt(licenseId)}`
    return response.status(200).json({ success: true, message: 'License activated successfully' })
  }

  // POST /api/admin/licenses/:id/deactivate
  if (request.method === 'POST' && licenseId && pathParts[4] === 'deactivate') {
    await sql`UPDATE license_keys SET status = 'inactive' WHERE id = ${parseInt(licenseId)}`
    return response.status(200).json({ success: true, message: 'License deactivated successfully' })
  }

  // POST /api/admin/licenses/:id/ban
  if (request.method === 'POST' && licenseId && pathParts[4] === 'ban') {
    await sql`UPDATE license_keys SET status = 'banned' WHERE id = ${parseInt(licenseId)}`
    return response.status(200).json({ success: true, message: 'License banned successfully' })
  }

  return response.status(404).json({ error: 'License operation not found' })
}
