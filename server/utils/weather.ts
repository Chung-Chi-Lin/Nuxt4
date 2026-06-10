const WMO_ZH: Record<number, string> = {
  0: '晴天', 1: '多雲時晴', 2: '局部多雲', 3: '陰天',
  45: '有霧', 48: '冰霧',
  51: '毛毛雨', 53: '毛毛雨', 55: '霧雨',
  61: '小雨', 63: '中雨', 65: '大雨',
  71: '小雪', 73: '中雪', 75: '大雪', 77: '冰晶',
  80: '陣雨', 81: '中陣雨', 82: '暴雨',
  85: '小陣雪', 86: '大陣雪',
  95: '雷陣雨', 96: '雷陣雨夾冰雹', 99: '強雷陣雨',
}

const WMO_EN: Record<number, string> = {
  0: 'Clear', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Icy Fog',
  51: 'Light Drizzle', 53: 'Drizzle', 55: 'Heavy Drizzle',
  61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
  71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow', 77: 'Ice Crystals',
  80: 'Showers', 81: 'Rain Showers', 82: 'Heavy Showers',
  85: 'Snow Showers', 86: 'Heavy Snow Showers',
  95: 'Thunderstorm', 96: 'Thunderstorm w/ Hail', 99: 'Severe Thunderstorm',
}

const WMO_EMOJI: Record<number, string> = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '❄️', 77: '❄️',
  80: '🌦️', 81: '🌧️', 82: '⛈️',
  85: '🌨️', 86: '🌨️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
}

function lookup(map: Record<number, string>, code: number): string {
  if (map[code] !== undefined) return map[code]
  const keys = Object.keys(map).map(Number).sort((a, b) => b - a)
  for (const k of keys) {
    if (code >= k) return map[k]!
  }
  return ''
}

export function wmoZh(code: number)    { return lookup(WMO_ZH, code) }
export function wmoEn(code: number)    { return lookup(WMO_EN, code) }
export function wmoEmoji(code: number) { return lookup(WMO_EMOJI, code) }
