export default defineEventHandler(async (event) => {
  const { user, admin } = await requireUser(event)
  const { tripId, role = 'viewer' } = await readBody(event)

  if (!tripId) throw createError({ statusCode: 400, statusMessage: '缺少旅程 ID' })

  const { data: membership } = await admin
    .from('trip_members')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role === 'viewer')
    throw createError({ statusCode: 403, statusMessage: '無權限產生邀請連結' })

  // Generate URL-safe token server-side (avoid relying on DB-level encode functions)
  const rawToken = Buffer.from(crypto.getRandomValues(new Uint8Array(24))).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  const { data: invite, error } = await admin
    .from('trip_invites')
    .insert({ trip_id: tripId, created_by: user.id, role, token: rawToken })
    .select('token')
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: `產生邀請失敗: ${error.message}` })

  return { token: invite.token }
})
