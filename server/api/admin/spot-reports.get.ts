export default defineEventHandler(async (event) => {
  const { admin } = await requireAdmin(event)

  const { status } = getQuery(event) as { status?: string }

  let query = admin
    .from('spot_reports')
    .select('id, reason, note, status, created_at, spot_id, reporter_id')
    .order('created_at', { ascending: false })
    .limit(100)

  if (status && status !== 'all') query = query.eq('status', status)

  const { data: reports, error } = await query
  if (error) throw createError({ statusCode: 500, statusMessage: '載入失敗' })
  if (!reports?.length) return { reports: [] }

  // Batch fetch spots and reporter profiles
  const spotIds     = [...new Set(reports.map((r: any) => r.spot_id))]
  const reporterIds = [...new Set(reports.map((r: any) => r.reporter_id))]

  const [{ data: spots }, { data: reporters }] = await Promise.all([
    admin.from('spots').select('id, name, emoji, lat, lng').in('id', spotIds),
    admin.from('profiles').select('id, username').in('id', reporterIds),
  ])

  const spotMap     = Object.fromEntries((spots     ?? []).map((s: any) => [s.id, s]))
  const reporterMap = Object.fromEntries((reporters ?? []).map((p: any) => [p.id, p]))

  return {
    reports: reports.map((r: any) => ({
      id:         r.id,
      reason:     r.reason,
      note:       r.note,
      status:     r.status,
      created_at: r.created_at,
      spot:     spotMap[r.spot_id]     ?? { id: r.spot_id,     name: '（已刪除）', emoji: '📍' },
      reporter: reporterMap[r.reporter_id] ?? { id: r.reporter_id, username: '匿名' },
    })),
  }
})
