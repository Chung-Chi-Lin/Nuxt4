export default defineEventHandler(async (event) => {
  const { user, admin } = await requireUser(event)
  const { name, description } = await readBody(event)

  if (!name?.trim()) throw createError({ statusCode: 400, statusMessage: '請填寫旅程名稱' })

  const { data: trip, error } = await admin
    .from('trips')
    .insert({ name: name.trim(), description: description?.trim() || null, created_by: user.id })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: '建立失敗' })

  await admin.from('trip_members').insert({ trip_id: trip.id, user_id: user.id, role: 'owner' })

  const { data: day } = await admin
    .from('trip_days')
    .insert({ trip_id: trip.id, day_index: 0, label: 'Day 1' })
    .select()
    .single()

  return { trip: { ...trip, my_role: 'owner' }, days: day ? [day] : [] }
})
