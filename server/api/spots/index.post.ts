export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization') ?? ''
  const token      = authHeader.replace('Bearer ', '').trim()
  if (!token) throw createError({ statusCode: 401, statusMessage: '未登入' })

  const { name, emoji, lat, lng, tags, notes, is_public, address } = await readBody(event)

  if (!name?.trim())
    throw createError({ statusCode: 400, statusMessage: '請填寫地點名稱' })
  if (typeof lat !== 'number' || typeof lng !== 'number')
    throw createError({ statusCode: 400, statusMessage: '座標無效' })

  const admin = getSupabaseAdmin()
  const { data: { user }, error: authError } = await admin.auth.getUser(token)
  if (authError || !user) throw createError({ statusCode: 401, statusMessage: 'Token 無效或已過期' })

  // Get current XP and level before updating
  const { data: profile } = await admin
    .from('profiles')
    .select('xp, user_level')
    .eq('id', user.id)
    .single()

  const oldXp    = profile?.xp ?? 0
  const oldLevel = profile?.user_level ?? 1

  // Normalise input
  const cleanTags  = Array.isArray(tags) ? tags.filter(Boolean).slice(0, 5) : []
  const cleanNotes = notes?.trim() || ''

  // Calculate XP before insert (needed for xp_earned field)
  const { total: xpGained, breakdown } = calcSpotXp({
    is_public: Boolean(is_public),
    name:      name.trim(),
    tags:      cleanTags,
    notes:     cleanNotes,
  })

  // Insert spot
  const { data: spot, error } = await admin
    .from('spots')
    .insert({
      user_id:    user.id,
      name:       name.trim(),
      emoji:      emoji?.trim() || '📍',
      lat,
      lng,
      tags:       cleanTags,
      notes:      cleanNotes,
      is_public:  Boolean(is_public),
      xp_earned:  xpGained,
      address:    address?.trim() || null,
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: '儲存失敗' })

  const newXp    = oldXp + xpGained
  const newLevel = levelFromXp(newXp)
  const leveledUp = newLevel > oldLevel

  // Update profile (fire-and-forget errors are acceptable here)
  await admin
    .from('profiles')
    .update({ xp: newXp, user_level: newLevel })
    .eq('id', user.id)

  // Build leaderboard slice: 5 above + self + 4 below (≤10 entries)
  const { data: allProfiles } = await admin
    .from('profiles')
    .select('id, username, user_level, xp')
    .order('xp', { ascending: false })
    .limit(500)

  let leaderboard: { entries: any[]; userRank: number } = { entries: [], userRank: 1 }

  if (allProfiles?.length) {
    const userIdx  = allProfiles.findIndex(p => p.id === user.id)
    const userRank = userIdx + 1
    const start    = Math.max(0, userIdx - 5)
    const end      = Math.min(allProfiles.length, userIdx + 5)

    leaderboard = {
      entries: allProfiles.slice(start, end).map((p, i) => ({
        id:         p.id,
        username:   p.username,
        user_level: p.user_level,
        xp:         p.xp,
        rank:       start + i + 1,
        isMe:       p.id === user.id,
      })),
      userRank,
    }
  }

  return { spot, xpGained, breakdown, newXp, oldXp, newLevel, oldLevel, leveledUp, leaderboard }
})
