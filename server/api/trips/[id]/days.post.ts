export default defineEventHandler(async (event) => {
  const { user, admin } = await requireUser(event)
  const id = getRouterParam(event, 'id')

  const { data: membership } = await admin
    .from('trip_members')
    .select('role')
    .eq('trip_id', id)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role === 'viewer')
    throw createError({ statusCode: 403, statusMessage: '無編輯權限' })

  const { data: existingDays } = await admin
    .from('trip_days')
    .select('day_index')
    .eq('trip_id', id)
    .order('day_index', { ascending: false })
    .limit(1)

  const nextIndex = (existingDays?.[0]?.day_index ?? -1) + 1

  const { data: day, error } = await admin
    .from('trip_days')
    .insert({ trip_id: id, day_index: nextIndex, label: `Day ${nextIndex + 1}` })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: '新增失敗' })

  await admin.from('trips').update({ updated_at: new Date().toISOString() }).eq('id', id)

  return { day }
})
