export default defineEventHandler(async (event) => {
  const { admin, user } = await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: '缺少回報 ID' })

  const { status, deleteSpot, spotId } = await readBody<{
    status:      string
    deleteSpot?: boolean
    spotId?:     string
  }>(event)

  if (!['resolved', 'dismissed'].includes(status))
    throw createError({ statusCode: 400, statusMessage: '無效狀態' })

  if (deleteSpot && spotId) {
    await admin.from('spots').delete().eq('id', spotId)
  }

  const { error } = await admin
    .from('spot_reports')
    .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: user.id })
    .eq('id', id)

  if (error) throw createError({ statusCode: 500, statusMessage: '更新失敗' })

  return { ok: true }
})
