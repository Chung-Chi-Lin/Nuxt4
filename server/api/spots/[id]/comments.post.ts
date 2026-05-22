export default defineEventHandler(async (event) => {
  const token = getHeader(event, 'authorization')?.replace('Bearer ', '').trim()
  if (!token) throw createError({ statusCode: 401, statusMessage: '未登入' })

  const spotId = getRouterParam(event, 'id')
  if (!spotId) throw createError({ statusCode: 400, statusMessage: '缺少標記 ID' })

  const { content } = await readBody<{ content: string }>(event)
  const trimmed = content?.trim() ?? ''
  if (!trimmed || trimmed.length > 300)
    throw createError({ statusCode: 400, statusMessage: '評論內容需在 1–300 字之間' })

  const admin = getSupabaseAdmin()
  const { data: { user }, error: authErr } = await admin.auth.getUser(token)
  if (authErr || !user) throw createError({ statusCode: 401, statusMessage: 'Token 無效' })

  const { data: spot } = await admin
    .from('spots').select('user_id').eq('id', spotId).single()
  if (!spot) throw createError({ statusCode: 404, statusMessage: '標記不存在' })
  if (spot.user_id === user.id)
    throw createError({ statusCode: 400, statusMessage: '不能評論自己的標記' })

  const { data: comment, error } = await admin
    .from('spot_comments')
    .insert({ spot_id: spotId, user_id: user.id, content: trimmed })
    .select('id, content, created_at, user_id')
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: '新增評論失敗' })

  const { data: profile } = await admin
    .from('profiles').select('username, avatar_url').eq('id', user.id).single()

  return {
    comment: {
      ...(comment as any),
      username:   profile?.username   ?? '匿名用戶',
      avatar_url: profile?.avatar_url ?? null,
      is_mine:    true,
    },
  }
})
