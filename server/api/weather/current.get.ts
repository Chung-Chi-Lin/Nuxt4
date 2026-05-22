import { wmoZh, wmoEmoji } from '../../utils/weather'

interface OpenMeteoResponse {
  current: {
    temperature_2m: number
    weather_code: number
    precipitation: number
    wind_speed_10m: number
  }
  daily: {
    precipitation_probability_max: number[]
  }
}

export default defineEventHandler(async (event) => {
  const { lat, lng } = getQuery(event)
  if (!lat || !lng) throw createError({ statusCode: 400, statusMessage: '缺少 lat/lng' })

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,precipitation,wind_speed_10m&daily=precipitation_probability_max&timezone=auto`
  const res = await $fetch<OpenMeteoResponse>(url)
  const code = res.current.weather_code

  return {
    temp:       Math.round(res.current.temperature_2m),
    emoji:      wmoEmoji(code),
    desc:       wmoZh(code),
    precip:     res.current.precipitation,
    windSpeed:  Math.round(res.current.wind_speed_10m),
    precipProb: res.daily.precipitation_probability_max[0] ?? 0,
  }
})
