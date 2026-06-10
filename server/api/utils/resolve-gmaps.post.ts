export default defineEventHandler(async (event) => {
  const { url } = await readBody(event)
  if (!url?.trim()) throw createError({ statusCode: 400, statusMessage: '請提供 URL' })

  let targetUrl = url.trim()

  // 短網址需 server 端跟隨 redirect（瀏覽器有 CORS 限制）
  if (targetUrl.includes('goo.gl') || targetUrl.includes('maps.app.goo.gl')) {
    try {
      const res = await fetch(targetUrl, {
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BojjiMap/1.0)' },
      })
      targetUrl = res.url
    } catch {
      throw createError({ statusCode: 400, statusMessage: '短網址解析失敗，請改貼完整的 Google Maps 連結' })
    }
  }

  const result = parseGmapsUrl(targetUrl)
  if (!result) throw createError({ statusCode: 400, statusMessage: '無法從此連結取得座標，請確認是 Google Maps 分享連結' })

  return result
})

function parseGmapsUrl(url: string): { lat: number; lng: number; name: string } | null {
  // 最常見格式：/@lat,lng,zoom
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (atMatch) {
    return {
      lat:  parseFloat(atMatch[1]!),
      lng:  parseFloat(atMatch[2]!),
      name: extractPlaceName(url),
    }
  }
  // ?q=lat,lng
  const qMatch = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/)
  if (qMatch) return { lat: parseFloat(qMatch[1]!), lng: parseFloat(qMatch[2]!), name: '' }
  // ?ll=lat,lng（舊格式）
  const llMatch = url.match(/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/)
  if (llMatch) return { lat: parseFloat(llMatch[1]!), lng: parseFloat(llMatch[2]!), name: '' }

  return null
}

function extractPlaceName(url: string): string {
  try {
    const m = url.match(/\/place\/([^/@]+)\/@/)
    if (m) return decodeURIComponent(m[1]!.replace(/\+/g, ' '))
  } catch {}
  return ''
}
