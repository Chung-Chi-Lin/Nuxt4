import { wmoZh, wmoEmoji } from '../../utils/weather'

const DAILY_LIMIT = 15
const GROQ_URL    = 'https://api.groq.com/openai/v1/chat/completions'

// ── 網站操作 FAQ（固定答案，AI 必須照抄，不得自行發揮）─────────────
const SITE_FAQ = `
問：如何新增美食地點？
答：在地圖上點擊任意位置，就會跳出新增表單。填寫名稱、評分、備註後按儲存，標記就會出現在地圖上囉！🍜

問：如何編輯或刪除地點？
答：點擊地圖上已有的標記，在彈出的卡片中選擇「編輯」即可修改資訊，或點「刪除」移除該地點。只能操作自己新增的地點喔。

問：XP 和等級怎麼計算？
答：每次新增美食地點都會獲得 XP，累積到一定數量就會自動升級！等級越高，頭像旁的徽章越特別。✨

問：天氣資訊是什麼？
答：右上角顯示的是地圖中心點的即時天氣。移動地圖停止 2 秒後自動更新，移動時會顯示橘色跳動圓點表示取得中。

問：如何讓地圖跳到我的位置？
答：第一次進入地圖時，會詢問是否允許定位。點選「允許」並同意瀏覽器的定位請求，地圖就會自動飛到你所在的位置！📍

問：頭像怎麼上傳？
答：點擊右上角的頭像或使用者名稱，進入個人頁面後即可上傳大頭照。支援 JPG、PNG 等常見格式。
`.trim()

// ── 天氣抓取（best-effort，失敗不影響回應）──────────────────────────
interface WeatherCtx {
  emoji: string
  temp: number
  desc: string
  precipProb: number
  windSpeed: number
}

async function fetchWeather(lat: number, lng: number): Promise<WeatherCtx | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m&daily=precipitation_probability_max&timezone=auto`
    const res = await $fetch<any>(url)
    const code = res.current.weather_code as number
    return {
      emoji:      wmoEmoji(code),
      temp:       Math.round(res.current.temperature_2m),
      desc:       wmoZh(code),
      precipProb: res.daily.precipitation_probability_max[0] ?? 0,
      windSpeed:  Math.round(res.current.wind_speed_10m),
    }
  } catch {
    return null
  }
}

// ── 景點 context 格式化 ────────────────────────────────────────────
function buildSpotsContext(spots: any[]): string {
  if (!spots.length) return ''
  const lines = spots.map((s, i) => {
    const cat   = s.category === 'landmark' ? '景點' : s.category === 'entertainment' ? '娛樂' : '美食'
    const tags  = (s.tags ?? []).join('、') || '—'
    const notes = s.notes || '—'
    const addr  = s.address || '—'
    return `${i + 1}. ${s.name}（${cat}）｜地址：${addr}｜標籤：${tags}｜備註：${notes}`
  })
  return `\n\n【地圖上可見地點（共 ${spots.length} 個）】\n${lines.join('\n')}`
}

// ── Main handler ──────────────────────────────────────────────────
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Auth
  const authHeader = getHeader(event, 'authorization') ?? ''
  const token      = authHeader.replace('Bearer ', '').trim()
  if (!token) throw createError({ statusCode: 401, statusMessage: '未登入' })

  const admin = getSupabaseAdmin()
  const { data: { user }, error: authError } = await admin.auth.getUser(token)
  if (authError || !user) throw createError({ statusCode: 401, statusMessage: 'Token 無效或已過期' })

  // Body
  const body    = await readBody(event)
  const message = (body?.message ?? '').toString().trim().slice(0, 500)
  if (!message) throw createError({ statusCode: 400, statusMessage: '請輸入問題' })

  const spots: any[] = Array.isArray(body?.spots) ? body.spots.slice(0, 30) : []
  const lat = typeof body?.lat === 'number' ? body.lat : NaN
  const lng = typeof body?.lng === 'number' ? body.lng : NaN

  const today = new Date().toLocaleDateString('sv-SE')

  // 取 bot_plan（無紀錄則用預設值）
  let dailyLimit  = DAILY_LIMIT
  let isUnlimited = false
  try {
    const { data: plan } = await admin
      .from('bot_plan')
      .select('tier, daily_limit, trial_expires_at')
      .eq('user_id', user.id)
      .maybeSingle()

    if (plan?.tier === 'unlimited') {
      isUnlimited = true
    } else if (plan?.tier === 'trial') {
      const expired = plan.trial_expires_at && new Date(plan.trial_expires_at) < new Date()
      dailyLimit = expired ? DAILY_LIMIT : (plan.daily_limit ?? DAILY_LIMIT)
    } else if (plan) {
      dailyLimit = plan.daily_limit ?? DAILY_LIMIT
    }
  } catch { /* use default */ }

  // 取今日用量
  let currentCount = 0
  try {
    const { data: usage } = await admin
      .from('bot_usage')
      .select('count')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle()
    currentCount = usage?.count ?? 0
  } catch { /* table may not exist yet */ }

  if (!isUnlimited && currentCount >= dailyLimit) {
    throw createError({
      statusCode: 429,
      statusMessage: `今日問答次數已達上限（${dailyLimit} 次），明天再來找波吉吧！🐾`,
    })
  }

  // 取天氣（有 lat/lng 才取）
  const weather = !isNaN(lat) && !isNaN(lng) ? await fetchWeather(lat, lng) : null

  // 天氣 context
  const weatherCtx = weather
    ? `\n\n【當前天氣】${weather.emoji} ${weather.temp}°C ${weather.desc}｜降雨機率 ${weather.precipProb}%｜風速 ${weather.windSpeed} km/h\n` +
      `規劃行程時請依天氣狀況建議：晴天（降雨 < 30%）優先推薦戶外景點；降雨機率 30–60% 提醒攜帶雨具；60% 以上優先推薦室內美食或有遮蔽場所。`
    : ''

  // 景點 context
  const spotsCtx = buildSpotsContext(spots)

  // ── System Prompt ────────────────────────────────────────────────
  const systemPrompt = `你是「波吉小助手」，波吉的美食地圖網站的官方 AI 柯基犬助手🐶。

【你只回答以下兩類問題，超出範圍請婉拒並引導回主題】
1. 網站操作問題 → 嚴格按照【網站操作標準答案】逐字回答，不得自行發揮或補充
2. 美食 / 旅遊行程規劃 → 根據提供的地點資料與天氣狀況回答

【如果用戶問的不屬於以上兩類】
直接回應：「汪！這部分超出波吉的能力範圍，但我很擅長規劃美食行程！要試試嗎？🐾」

【行程規劃輸出格式】
每個地點格式如下，每個地點各佔一行，地點之間用空行分隔：

1. ⏰ 時間 → 📍 地點名稱 — 推薦原因（一句話）⏱ 停留約 X 分鐘
2. ⏰ 時間 → 📍 地點名稱 — 推薦原因（一句話）⏱ 停留約 X 分鐘

天氣提醒（若有天氣資料）：用空行與行程分隔，獨立一行。
優先使用【地圖上可見地點】的資料，不足才可補充其他地點。
不超過 400 字，不要加標題或分節符號。

【語言與語氣】
繁體中文，親切自然，偶爾使用「汪！」或「🐾」，不要過度賣萌。

【網站操作標準答案】
${SITE_FAQ}
${weatherCtx}${spotsCtx}`

  // Call Groq
  let answer: string
  try {
    const result = await $fetch<any>(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${config.groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        model:       'llama-3.1-8b-instant',
        messages:    [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: message },
        ],
        max_tokens:  700,
        temperature: 0.65,
      },
    })
    answer = result.choices?.[0]?.message?.content?.trim() ?? '抱歉，波吉現在說不出話來，請稍後再試 🐾'
  } catch {
    throw createError({ statusCode: 502, statusMessage: '波吉現在太忙了，請稍後再試 🐾' })
  }

  // Increment usage（best-effort）
  try {
    await admin.from('bot_usage').upsert(
      { user_id: user.id, date: today, count: currentCount + 1 },
      { onConflict: 'user_id,date' },
    )
  } catch { /* ignore */ }

  return {
    answer,
    remaining: isUnlimited ? -1 : dailyLimit - currentCount - 1,
  }
})
