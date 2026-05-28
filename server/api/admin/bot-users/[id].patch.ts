const VALID_TIERS = ['free', 'trial', 'pro', 'unlimited'] as const

export default defineEventHandler(async (event) => {
  const { admin } = await requireAdmin(event)

  const userId = getRouterParam(event, 'id')
  if (!userId) throw createError({ statusCode: 400, statusMessage: '缺少 user_id' })

  const body = await readBody(event)

  const tier          = VALID_TIERS.includes(body.tier) ? body.tier : 'free'
  const daily_limit   = Math.max(1, Math.min(9999, Number(body.daily_limit  ?? 15)))
  const bonus_credits = Math.max(0, Number(body.bonus_credits ?? 0))
  // trial_expires_at: date string 'YYYY-MM-DD' or null
  const trial_expires_at = body.trial_expires_at || null
  const credits_note     = (body.credits_note ?? '').toString().slice(0, 200) || null

  const { error } = await admin.from('bot_plan').upsert({
    user_id: userId,
    tier,
    daily_limit,
    bonus_credits,
    trial_expires_at,
    credits_note,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  if (error) throw createError({ statusCode: 500, statusMessage: '更新失敗' })

  return { ok: true }
})
