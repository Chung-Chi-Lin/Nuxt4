export async function requireUser(event: any) {
  const authHeader = getHeader(event, 'authorization') ?? ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) throw createError({ statusCode: 401, statusMessage: '未登入' })

  const admin = getSupabaseAdmin()
  const { data: { user }, error } = await admin.auth.getUser(token)
  if (error || !user) throw createError({ statusCode: 401, statusMessage: 'Token 無效或已過期' })

  return { user, admin }
}
