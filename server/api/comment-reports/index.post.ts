export default defineEventHandler(async (event) => {
  const token = getHeader(event, 'authorization')?.replace('Bearer ', '').trim()
  if (!token) throw createError({ statusCode: 401, statusMessage: '未登入' })

  const { commentId, reason, note } = await readBody<{
    commentId: string
    reason:    string
    note?:     string
  }>(event)

  if (!commentId || !reason)
    throw createError({ statusCode: 400, statusMessage: '缺少必要欄位' })

  const admin = getSupabaseAdmin()
  const { data: { user }, error: authErr } = await admin.auth.getUser(token)
  if (authErr || !user) throw createError({ statusCode: 401, statusMessage: 'Token 無效' })

  const { data: comment } = await admin
    .from('spot_comments').select('user_id').eq('id', commentId).single()
  if (!comment) throw createError({ statusCode: 404, statusMessage: '評論不存在' })
  if (comment.user_id === user.id)
    throw createError({ statusCode: 400, statusMessage: '不能回報自己的評論' })

  const { data: existing } = await admin
    .from('comment_reports')
    .select('id')
    .eq('comment_id', commentId)
    .eq('reporter_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing)
    throw createError({ statusCode: 409, statusMessage: '你已回報過此評論，請等待審核' })

  const { error: insertErr } = await admin.from('comment_reports').insert({
    comment_id:  commentId,
    reporter_id: user.id,
    reason,
    note:        note?.trim() || null,
    status:      'pending',
  })

  if (insertErr) throw createError({ statusCode: 500, statusMessage: '回報失敗，請稍後再試' })

  return { ok: true }
})
