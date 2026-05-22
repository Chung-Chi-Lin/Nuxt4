export default defineEventHandler(async (event) => {
  const token = getHeader(event, 'authorization')?.replace('Bearer ', '').trim()
  if (!token) throw createError({ statusCode: 401, statusMessage: '未登入' })

  const spotId = getRouterParam(event, 'id')
  if (!spotId) throw createError({ statusCode: 400, statusMessage: '缺少標記 ID' })

  const admin = getSupabaseAdmin()
  const { data: { user }, error: authErr } = await admin.auth.getUser(token)
  if (authErr || !user) throw createError({ statusCode: 401, statusMessage: 'Token 無效' })

  const { data: comments, error } = await admin
    .from('spot_comments')
    .select('id, content, created_at, user_id')
    .eq('spot_id', spotId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw createError({ statusCode: 500, statusMessage: '載入評論失敗' })
  if (!comments?.length) return { comments: [] }

  const userIds = [...new Set(comments.map((c: any) => c.user_id))]
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', userIds)

  const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]))

  return {
    comments: comments.map((c: any) => ({
      id:         c.id,
      content:    c.content,
      created_at: c.created_at,
      user_id:    c.user_id,
      username:   profileMap[c.user_id]?.username  ?? '匿名用戶',
      avatar_url: profileMap[c.user_id]?.avatar_url ?? null,
      is_mine:    c.user_id === user.id,
    })),
  }
})
