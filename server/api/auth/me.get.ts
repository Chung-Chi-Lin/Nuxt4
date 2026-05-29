export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization') ?? ''
  const token      = authHeader.replace('Bearer ', '').trim()

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: '未登入' })
  }

  const admin = getSupabaseAdmin()

  const { data: { user }, error } = await admin.auth.getUser(token)
  if (error || !user) {
    throw createError({ statusCode: 401, statusMessage: 'Token 無效或已過期' })
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('username, avatar_url, user_level, xp, role')
    .eq('id', user.id)
    .single()

  // 若 client 有帶 session guard header，另外查 session_token 比對
  const clientSession = getHeader(event, 'x-session-id')?.trim()
  if (clientSession) {
    const { data: sessionRow } = await admin
      .from('profiles')
      .select('session_token')
      .eq('id', user.id)
      .single()
    if (sessionRow?.session_token && clientSession !== sessionRow.session_token) {
      throw createError({ statusCode: 401, statusMessage: 'SESSION_INVALID' })
    }
  }

  return {
    user: {
      id:         user.id,
      email:      user.email,
      username:   profile?.username ?? user.user_metadata?.username ?? user.email?.split('@')[0],
      avatar_url: profile?.avatar_url ?? null,
      user_level: profile?.user_level ?? 1,
      xp:         profile?.xp ?? 0,
      role:       profile?.role ?? 'user',
    }
  }
})
