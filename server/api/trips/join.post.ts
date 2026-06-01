export default defineEventHandler(async (event) => {
  const { user, admin } = await requireUser(event)
  const { token } = await readBody(event)

  if (!token?.trim()) throw createError({ statusCode: 400, statusMessage: '缺少邀請碼' })

  const { data: invite } = await admin
    .from('trip_invites')
    .select('id, trip_id, role, expires_at')
    .eq('token', token.trim())
    .single()

  if (!invite) throw createError({ statusCode: 404, statusMessage: '邀請連結無效' })
  if (new Date(invite.expires_at) < new Date())
    throw createError({ statusCode: 410, statusMessage: '邀請連結已過期' })

  const { data: existing } = await admin
    .from('trip_members')
    .select('role')
    .eq('trip_id', invite.trip_id)
    .eq('user_id', user.id)
    .single()

  if (!existing) {
    await admin.from('trip_members').insert({
      trip_id: invite.trip_id,
      user_id: user.id,
      role: invite.role,
    })
  }

  const { data: trip } = await admin
    .from('trips')
    .select('id, name')
    .eq('id', invite.trip_id)
    .single()

  return { trip, already_member: Boolean(existing) }
})
