import { wmoZh, wmoEn, wmoEmoji } from '../../utils/weather'

const REGIONS = [
  { nameZh: '北部', nameEn: 'North',   lat: 25.038, lng: 121.542 },
  { nameZh: '中部', nameEn: 'Central', lat: 24.148, lng: 120.674 },
  { nameZh: '南部', nameEn: 'South',   lat: 22.627, lng: 120.301 },
  { nameZh: '東部', nameEn: 'East',    lat: 23.977, lng: 121.604 },
]

interface OpenMeteoResponse {
  current: { temperature_2m: number; weather_code: number }
}

let cache: { zh: string; en: string; ts: number } | null = null
const CACHE_MS = 30 * 60 * 1000

export default defineEventHandler(async () => {
  if (cache && Date.now() - cache.ts < CACHE_MS) {
    return { zh: cache.zh, en: cache.en }
  }

  const results = await Promise.all(
    REGIONS.map(async (r) => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${r.lat}&longitude=${r.lng}&current=temperature_2m,weather_code&timezone=Asia/Taipei`
      const res = await $fetch<OpenMeteoResponse>(url)
      const code = res.current.weather_code
      const temp = Math.round(res.current.temperature_2m)
      return {
        nameZh: r.nameZh, nameEn: r.nameEn,
        emoji: wmoEmoji(code),
        descZh: wmoZh(code),
        descEn: wmoEn(code),
        temp,
      }
    })
  )

  const zh = results.map(r => `${r.emoji} ${r.nameZh}${r.descZh} ${r.temp}°C`).join('　｜　')
  const en = results.map(r => `${r.emoji} ${r.nameEn}: ${r.descEn} ${r.temp}°C`).join('  |  ')

  cache = { zh, en, ts: Date.now() }
  return { zh, en }
})
