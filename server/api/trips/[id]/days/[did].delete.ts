export default defineEventHandler(async (event) => {
  const { user, admin } = await requireUser(event)
  const id  = getRouterParam(event, 'id')
  const did = getRouterParam(event, 'did')

  const { data: membership } = await admin
    .from('trip_members')
    .select('role')
    .eq('trip_id', id)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role === 'viewer')
    throw createError({ statusCode: 403, statusMessage: '無編輯權限' })

  const { count } = await admin
    .from('trip_days')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', id)

  if ((count ?? 0) <= 1)
    throw createError({ statusCode: 400, statusMessage: '至少保留一天' })

  await admin.from('trip_days').delete().eq('id', did).eq('trip_id', id)

  // Re-index remaining days
  const { data: remaining } = await admin
    .from('trip_days')
    .select('id, day_index')
    .eq('trip_id', id)
    .order('day_index')

  for (let i = 0; i < (remaining ?? []).length; i++) {
    const day = remaining![i]!
    if (day.day_index !== i) {
      await admin.from('trip_days')
        .update({ day_index: i, label: `Day ${i + 1}` })
        .eq('id', day.id)
    }
  }

  await admin.from('trips').update({ updated_at: new Date().toISOString() }).eq('id', id)

  return { ok: true }
})
