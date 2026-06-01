export default defineEventHandler(async (event) => {
  const { user, admin } = await requireUser(event)
  const id = getRouterParam(event, 'id')

  const { data: myMembership } = await admin
    .from('trip_members')
    .select('role')
    .eq('trip_id', id)
    .eq('user_id', user.id)
    .single()

  if (!myMembership) throw createError({ statusCode: 403, statusMessage: '無存取權限' })

  const { data: members } = await admin
    .from('trip_members')
    .select('user_id, role, joined_at')
    .eq('trip_id', id)

  if (!members?.length) return { members: [] }

  const userIds = members.map(m => m.user_id)

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, username, avatar_url, user_level')
    .in('id', userIds)

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

  return {
    members: members.map(m => ({
      user_id:    m.user_id,
      role:       m.role,
      joined_at:  m.joined_at,
      username:   profileMap[m.user_id]?.username ?? '匿名',
      avatar_url: profileMap[m.user_id]?.avatar_url ?? null,
      user_level: profileMap[m.user_id]?.user_level ?? 1,
      is_me:      m.user_id === user.id,
    })),
  }
})
