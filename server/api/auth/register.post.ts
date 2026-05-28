export default defineEventHandler(async (event) => {
  const body     = await readBody(event)
  const email    = (body?.email    ?? '').trim().toLowerCase()
  const password = (body?.password ?? '')
  const username = (body?.username ?? '').trim()

  // ── 前端防呆再過一層後端驗證 ─────────────────────────────
  if (!email)            throw createError({ statusCode: 400, statusMessage: '請填寫 Email' })
  if (!password)         throw createError({ statusCode: 400, statusMessage: '請填寫密碼' })
  if (password.length < 6) throw createError({ statusCode: 400, statusMessage: '密碼至少需要 6 個字元' })

  const admin  = getSupabaseAdmin()
  const client = getSupabaseClient()

  // ── 重複 Email 檢查（查 profiles 表）────────────────────
  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existing) {
    throw createError({ statusCode: 409, statusMessage: '此 Email 已被註冊，請直接登入' })
  }

  // ── 建立 Supabase Auth 帳號 ──────────────────────────────
  const displayName = username || email.split('@')[0]

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { username: displayName } },
  })

  if (error) {
    // Supabase 本身也會回傳 already registered
    if (error.message.toLowerCase().includes('already registered')) {
      throw createError({ statusCode: 409, statusMessage: '此 Email 已被註冊，請直接登入' })
    }
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  if (!data.user) {
    throw createError({ statusCode: 500, statusMessage: '註冊失敗，請稍後再試' })
  }

  // ── 寫入 profiles 表（用 admin 繞過 RLS）────────────────
  const sessionToken = data.session ? crypto.randomUUID() : null
  const { error: profileError } = await admin
    .from('profiles')
    .insert({
      id:            data.user.id,
      username:      displayName,
      email,
      session_token: sessionToken,
    })

  if (profileError) {
    // Auth 帳號建好但 profile 失敗，記錄起來但不擋使用者
    console.error('[register] profiles insert failed:', profileError.message)
  }

  return {
    user: {
      id:       data.user.id,
      email:    data.user.email,
      username: displayName,
    },
    token:        data.session?.access_token ?? null,
    sessionToken: sessionToken,
    requiresConfirmation: !data.session,
  }
})
