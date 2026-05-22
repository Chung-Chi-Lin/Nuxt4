export default defineEventHandler(async (event) => {
  const token = getHeader(event, 'authorization')?.replace('Bearer ', '').trim()
  if (!token) throw createError({ statusCode: 401, statusMessage: '未登入' })

  const cid = getRouterParam(event, 'cid')
  if (!cid) throw createError({ statusCode: 400, statusMessage: '缺少評論 ID' })

  const admin = getSupabaseAdmin()
  const { data: { user }, error: authErr } = await admin.auth.getUser(token)
  if (authErr || !user) throw createError({ statusCode: 401, statusMessage: 'Token 無效' })

  const { error } = await admin
    .from('spot_comments')
    .delete()
    .eq('id', cid)
    .eq('user_id', user.id)

  if (error) throw createError({ statusCode: 500, statusMessage: '刪除失敗' })

  return { ok: true }
})
