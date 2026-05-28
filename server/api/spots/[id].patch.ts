export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization') ?? ''
  const token      = authHeader.replace('Bearer ', '').trim()
  if (!token) throw createError({ statusCode: 401, statusMessage: '未登入' })

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: '缺少 ID' })

  const { name, emoji, tags, notes, is_public, photo_urls, category } = await readBody(event)

  if (!name?.trim()) throw createError({ statusCode: 400, statusMessage: '請填寫地點名稱' })

  const admin = getSupabaseAdmin()
  const { data: { user }, error: authError } = await admin.auth.getUser(token)
  if (authError || !user) throw createError({ statusCode: 401, statusMessage: 'Token 無效或已過期' })

  const { data: spot, error } = await admin
    .from('spots')
    .update({
      name:       name.trim(),
      emoji:      emoji?.trim() || '📍',
      tags:       Array.isArray(tags) ? tags.filter(Boolean).slice(0, 5) : [],
      notes:      notes?.trim() || '',
      is_public:  Boolean(is_public),
      photo_urls: Array.isArray(photo_urls) ? photo_urls.slice(0, 3) : [],
      ...(category ? { category } : {}),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error || !spot) throw createError({ statusCode: 500, statusMessage: '更新失敗' })

  return { spot }
})
