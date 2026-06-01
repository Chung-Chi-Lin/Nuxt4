export default defineEventHandler(async (event) => {
  const { user, admin } = await requireUser(event)

  const { data: memberships } = await admin
    .from('trip_members')
    .select('trip_id, role')
    .eq('user_id', user.id)

  if (!memberships?.length) return { trips: [] }

  const tripIds = memberships.map(m => m.trip_id)
  const roleMap = Object.fromEntries(memberships.map(m => [m.trip_id, m.role]))

  const { data: trips } = await admin
    .from('trips')
    .select('id, name, description, created_by, created_at, updated_at')
    .in('id', tripIds)
    .order('updated_at', { ascending: false })

  return { trips: (trips ?? []).map(t => ({ ...t, my_role: roleMap[t.id] })) }
})
