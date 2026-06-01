export default defineEventHandler(async (event) => {
  const { user, admin } = await requireUser(event)
  const id = getRouterParam(event, 'id')

  const { data: membership } = await admin
    .from('trip_members')
    .select('role')
    .eq('trip_id', id)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'owner')
    throw createError({ statusCode: 403, statusMessage: '只有旅程擁有者可刪除' })

  const { error } = await admin.from('trips').delete().eq('id', id)
  if (error) throw createError({ statusCode: 500, statusMessage: '刪除失敗' })

  return { ok: true }
})
