export default defineEventHandler(async (event) => {
  const token = getHeader(event, 'authorization')?.replace('Bearer ', '').trim()
  if (!token) throw createError({ statusCode: 401, statusMessage: '未登入' })

  const { spotId, reason, note } = await readBody<{
    spotId: string
    reason: string
    note?: string
  }>(event)

  if (!spotId || !reason) {
    throw createError({ statusCode: 400, statusMessage: '缺少必要欄位' })
  }

  const admin = getSupabaseAdmin()

  const { data: { user }, error: authErr } = await admin.auth.getUser(token)
  if (authErr || !user) throw createError({ statusCode: 401, statusMessage: 'Token 無效' })

  // 不能回報自己的標記
  const { data: spot } = await admin
    .from('spots').select('user_id').eq('id', spotId).single()
  if (spot?.user_id === user.id) {
    throw createError({ statusCode: 400, statusMessage: '不能回報自己的標記' })
  }

  // 同一標記同一人有待審回報時，不重複提交
  const { data: existing } = await admin
    .from('spot_reports')
    .select('id')
    .eq('spot_id', spotId)
    .eq('reporter_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing) {
    throw createError({ statusCode: 409, statusMessage: '你已回報過此標記，請等待審核' })
  }

  const { error: insertErr } = await admin.from('spot_reports').insert({
    spot_id:     spotId,
    reporter_id: user.id,
    reason,
    note:        note?.trim() || null,
    status:      'pending',
  })

  if (insertErr) throw createError({ statusCode: 500, statusMessage: '回報失敗，請稍後再試' })

  return { ok: true }
})
