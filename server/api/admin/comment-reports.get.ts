export default defineEventHandler(async (event) => {
  const { admin } = await requireAdmin(event)

  const { status } = getQuery(event) as { status?: string }

  let query = admin
    .from('comment_reports')
    .select('id, reason, note, status, created_at, comment_id, reporter_id')
    .order('created_at', { ascending: false })
    .limit(100)

  if (status && status !== 'all') query = query.eq('status', status)

  const { data: reports, error } = await query
  if (error) throw createError({ statusCode: 500, statusMessage: '載入失敗' })
  if (!reports?.length) return { reports: [] }

  // Batch fetch comments, then spots + authors
  const commentIds  = [...new Set(reports.map((r: any) => r.comment_id))]
  const reporterIds = [...new Set(reports.map((r: any) => r.reporter_id))]

  const [{ data: comments }, { data: reporters }] = await Promise.all([
    admin.from('spot_comments').select('id, content, user_id, spot_id').in('id', commentIds),
    admin.from('profiles').select('id, username').in('id', reporterIds),
  ])

  const existingComments = comments ?? []
  const authorIds = [...new Set(existingComments.map((c: any) => c.user_id))]
  const spotIds   = [...new Set(existingComments.map((c: any) => c.spot_id))]

  const [{ data: authors }, { data: spots }] = await Promise.all([
    admin.from('profiles').select('id, username').in('id', authorIds),
    admin.from('spots').select('id, name, emoji').in('id', spotIds),
  ])

  const commentMap  = Object.fromEntries(existingComments.map((c: any) => [c.id, c]))
  const reporterMap = Object.fromEntries((reporters ?? []).map((p: any) => [p.id, p]))
  const authorMap   = Object.fromEntries((authors   ?? []).map((p: any) => [p.id, p]))
  const spotMap     = Object.fromEntries((spots     ?? []).map((s: any) => [s.id, s]))

  return {
    reports: reports.map((r: any) => {
      const comment = commentMap[r.comment_id]
      return {
        id:         r.id,
        reason:     r.reason,
        note:       r.note,
        status:     r.status,
        created_at: r.created_at,
        comment_id: r.comment_id,
        reporter:   reporterMap[r.reporter_id] ?? { username: '匿名' },
        comment: comment
          ? {
              id:      comment.id,
              content: comment.content,
              author:  authorMap[comment.user_id] ?? { username: '匿名' },
              spot:    spotMap[comment.spot_id]   ?? { name: '（已刪除）', emoji: '📍' },
            }
          : null,
      }
    }),
  }
})
