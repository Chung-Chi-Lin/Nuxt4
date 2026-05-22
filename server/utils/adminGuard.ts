import type { H3Event } from 'h3'

export async function requireAdmin(event: H3Event) {
  const token = getHeader(event, 'authorization')?.replace('Bearer ', '').trim()
  if (!token) throw createError({ statusCode: 401, statusMessage: '未登入' })

  const admin = getSupabaseAdmin()
  const { data: { user }, error: authErr } = await admin.auth.getUser(token)
  if (authErr || !user) throw createError({ statusCode: 401, statusMessage: 'Token 無效' })

  const { data: profile } = await admin
    .from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role !== 'admin')
    throw createError({ statusCode: 403, statusMessage: '無管理員權限' })

  return { admin, user }
}
