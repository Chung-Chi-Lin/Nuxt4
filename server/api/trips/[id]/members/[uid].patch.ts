export default defineEventHandler(async (event) => {
  const { user, admin } = await requireUser(event)
  const id  = getRouterParam(event, 'id')
  const uid = getRouterParam(event, 'uid')

  const { role } = await readBody(event)
  if (!['editor', 'viewer'].includes(role))
    throw createError({ statusCode: 400, statusMessage: '無效的角色，僅接受 editor 或 viewer' })

  const { data: myMembership } = await admin
    .from('trip_members')
    .select('role')
    .eq('trip_id', id)
    .eq('user_id', user.id)
    .single()

  if (!myMembership || myMembership.role !== 'owner')
    throw createError({ statusCode: 403, statusMessage: '只有擁有者可以修改成員角色' })

  if (uid === user.id)
    throw createError({ statusCode: 400, statusMessage: '無法修改自身角色' })

  const { data: target } = await admin
    .from('trip_members')
    .select('role')
    .eq('trip_id', id)
    .eq('user_id', uid)
    .single()

  if (!target) throw createError({ statusCode: 404, statusMessage: '成員不存在' })
  if (target.role === 'owner') throw createError({ statusCode: 400, statusMessage: '不可修改擁有者角色' })

  await admin
    .from('trip_members')
    .update({ role })
    .eq('trip_id', id)
    .eq('user_id', uid)

  return { ok: true }
})
