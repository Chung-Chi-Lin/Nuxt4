export default defineEventHandler(async (event) => {
  const { user, admin } = await requireUser(event)
  const id = getRouterParam(event, 'id')

  const { data: membership } = await admin
    .from('trip_members')
    .select('role')
    .eq('trip_id', id)
    .eq('user_id', user.id)
    .single()

  if (!membership) throw createError({ statusCode: 403, statusMessage: '無存取權限' })

  const { data: trip } = await admin
    .from('trips')
    .select('id, name, description, created_by, created_at, updated_at')
    .eq('id', id)
    .single()

  if (!trip) throw createError({ statusCode: 404, statusMessage: '旅程不存在' })

  const { data: days } = await admin
    .from('trip_days')
    .select('id, trip_id, day_index, label')
    .eq('trip_id', id)
    .order('day_index')

  const dayIds = (days ?? []).map(d => d.id)
  let waypoints: any[] = []

  if (dayIds.length) {
    const { data: wps } = await admin
      .from('trip_waypoints')
      .select('id, day_id, spot_id, order_index, custom_name, emoji, lat, lng, transport_mode, notes')
      .in('day_id', dayIds)
      .order('order_index')
    waypoints = wps ?? []
  }

  return { trip: { ...trip, my_role: membership.role }, days: days ?? [], waypoints }
})
