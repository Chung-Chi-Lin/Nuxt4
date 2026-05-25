export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization') ?? ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) throw createError({ statusCode: 401, statusMessage: '未登入' })

  const { avatar_url } = await readBody<{ avatar_url: string }>(event)
  if (!avatar_url || !avatar_url.startsWith('https://api.dicebear.com/')) {
    throw createError({ statusCode: 400, statusMessage: '不支援此頭像來源' })
  }

  const admin = getSupabaseAdmin()
  const { data: { user }, error: authError } = await admin.auth.getUser(token)
  if (authError || !user) throw createError({ statusCode: 401, statusMessage: 'Token 無效或已過期' })

  const { error } = await admin
    .from('profiles')
    .update({ avatar_url })
    .eq('id', user.id)
  if (error) throw createError({ statusCode: 500, statusMessage: '套用失敗，請稍後再試' })

  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, avatar_url },
  })

  return { avatar_url }
})
