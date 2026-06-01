export default defineEventHandler(async (event) => {
  const { user, admin } = await requireUser(event)
  const id  = getRouterParam(event, 'id')
  const uid = getRouterParam(event, 'uid')

  const { data: myMembership } = await admin
    .from('trip_members')
    .select('role')
    .eq('trip_id', id)
    .eq('user_id', user.id)
    .single()

  if (!myMembership) throw createError({ statusCode: 403, statusMessage: '無存取權限' })
  if (myMembership.role !== 'owner' && uid !== user.id)
    throw createError({ statusCode: 403, statusMessage: '無權限移除其他成員' })

  const { data: target } = await admin
    .from('trip_members')
    .select('role')
    .eq('trip_id', id)
    .eq('user_id', uid)
    .single()

  if (target?.role === 'owner')
    throw createError({ statusCode: 400, statusMessage: '不可移除旅程擁有者' })

  await admin.from('trip_members').delete().eq('trip_id', id).eq('user_id', uid)

  return { ok: true }
})
