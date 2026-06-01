export default defineEventHandler(async (event) => {
  const { user, admin } = await requireUser(event)
  const id = getRouterParam(event, 'id')
  const { name, description } = await readBody(event)

  const { data: membership } = await admin
    .from('trip_members')
    .select('role')
    .eq('trip_id', id)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role === 'viewer')
    throw createError({ statusCode: 403, statusMessage: '無編輯權限' })

  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  if (name?.trim()) updates.name = name.trim()
  if (description !== undefined) updates.description = description?.trim() || null

  const { data: trip } = await admin
    .from('trips')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { trip }
})
