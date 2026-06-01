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

  const { waypoints } = await readBody(event)
  if (!Array.isArray(waypoints))
    throw createError({ statusCode: 400, statusMessage: '格式錯誤' })

  await admin.from('trip_waypoints').delete().eq('day_id', did)

  if (waypoints.length) {
    const rows = waypoints.map((wp: any, i: number) => ({
      day_id:         did,
      spot_id:        wp.spot_id || null,
      order_index:    i,
      custom_name:    wp.custom_name || null,
      emoji:          wp.emoji || '📍',
      lat:            wp.lat,
      lng:            wp.lng,
      transport_mode: wp.transport_mode || 'car',
      notes:          wp.notes || null,
    }))
    await admin.from('trip_waypoints').insert(rows)
  }

  await admin.from('trips').update({ updated_at: new Date().toISOString() }).eq('id', id)

  const { data: result } = await admin
    .from('trip_waypoints')
    .select('id, day_id, spot_id, order_index, custom_name, emoji, lat, lng, transport_mode, notes')
    .eq('day_id', did)
    .order('order_index')

  return { waypoints: result ?? [] }
})
