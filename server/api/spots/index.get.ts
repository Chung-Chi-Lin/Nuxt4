export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization') ?? ''
  const token      = authHeader.replace('Bearer ', '').trim()
  if (!token) throw createError({ statusCode: 401, statusMessage: '未登入' })

  const q     = getQuery(event)
  const north = parseFloat(q.north as string)
  const south = parseFloat(q.south as string)
  const east  = parseFloat(q.east  as string)
  const west  = parseFloat(q.west  as string)

  if ([north, south, east, west].some(isNaN)) {
    throw createError({ statusCode: 400, statusMessage: '缺少 viewport 參數' })
  }

  // 避免 zoom 太遠一次撈太多（超過 ~550km 範圍就先返空）
  if ((north - south) > 5 || (east - west) > 10) {
    return { spots: [] }
  }

  const admin = getSupabaseAdmin()
  const { data: { user }, error: authError } = await admin.auth.getUser(token)
  if (authError || !user) throw createError({ statusCode: 401, statusMessage: 'Token 無效或已過期' })

  const { data: spots, error } = await admin
    .from('spots')
    .select('id, user_id, name, emoji, lat, lng, tags, notes, is_public, photo_urls, xp_earned, created_at, address, category')
    .gte('lat', south).lte('lat', north)
    .gte('lng', west).lte('lng', east)
    .or(`is_public.eq.true,user_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(300)

  if (error) throw createError({ statusCode: 500, statusMessage: '載入失敗' })

  return { spots: spots ?? [] }
})
