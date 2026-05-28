export default defineEventHandler(async (event) => {
  const { admin } = await requireAdmin(event)

  const q       = getQuery(event)
  const search  = (q.search  ?? '').toString().trim().toLowerCase()
  const sort    = (q.sort    ?? 'week').toString()
  const showAll = q.showAll  === 'true'

  const today = new Date().toLocaleDateString('sv-SE')
  const from7 = new Date(Date.now() - 6 * 86_400_000).toLocaleDateString('sv-SE')

  // 平行撈資料
  const [
    authResult,
    { data: usageRows },
    { data: todayRows },
    { data: plans },
    { data: profiles },
  ] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from('bot_usage').select('user_id, count').gte('date', from7),
    admin.from('bot_usage').select('user_id, count').eq('date', today),
    admin.from('bot_plan').select('*'),
    admin.from('profiles').select('id, username'),
  ])

  const authUsers = authResult.data?.users ?? []

  // 聚合
  const weekMap: Record<string, number> = {}
  for (const r of usageRows ?? []) weekMap[r.user_id] = (weekMap[r.user_id] ?? 0) + r.count

  const todayMap: Record<string, number> = {}
  for (const r of todayRows ?? []) todayMap[r.user_id] = r.count

  const planMap: Record<string, any> = {}
  for (const p of plans ?? []) planMap[p.user_id] = p

  const profileMap: Record<string, string> = {}
  for (const p of profiles ?? []) profileMap[p.id] = p.username ?? ''

  // 整合
  let result = authUsers.map(u => ({
    id:          u.id,
    email:       u.email ?? '',
    username:    profileMap[u.id] ?? '',
    created_at:  u.created_at,
    today_count: todayMap[u.id] ?? 0,
    week_count:  weekMap[u.id]  ?? 0,
    plan:        planMap[u.id]  ?? null,
  }))

  // 預設只顯示有用量或有方案的用戶
  if (!showAll) {
    result = result.filter(u => u.week_count > 0 || u.plan !== null)
  }

  // 模糊搜尋
  if (search) {
    result = result.filter(u =>
      u.email.toLowerCase().includes(search) ||
      u.username.toLowerCase().includes(search)
    )
  }

  // 排序
  if (sort === 'week')  result.sort((a, b) => b.week_count  - a.week_count)
  if (sort === 'today') result.sort((a, b) => b.today_count - a.today_count)
  if (sort === 'email') result.sort((a, b) => a.email.localeCompare(b.email))
  if (sort === 'name')  result.sort((a, b) => a.username.localeCompare(b.username))

  // 統計摘要
  const stats = {
    totalToday:  Object.values(todayMap).reduce((a, b) => a + b, 0),
    totalWeek:   Object.values(weekMap).reduce((a, b) => a + b, 0),
    activeToday: Object.keys(todayMap).length,
    totalUsers:  authUsers.length,
  }

  return { users: result, stats }
})
