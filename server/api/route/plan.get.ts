export default defineEventHandler(async (event) => {
  const { coords, mode = 'car' } = getQuery(event) as { coords: string; mode: string }

  if (!coords) throw createError({ statusCode: 400, statusMessage: '缺少座標' })

  const profiles: Record<string, string> = {
    car:  'driving',
    walk: 'foot',
    bike: 'bike',
    bus:  'driving',
  }

  const profile = profiles[mode] ?? 'driving'
  const url = `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson`

  let res: any
  try {
    res = await $fetch<any>(url)
  } catch {
    throw createError({ statusCode: 502, statusMessage: '路線服務暫時無法使用' })
  }

  if (!res?.routes?.length) throw createError({ statusCode: 422, statusMessage: '無法計算路線' })

  const route = res.routes[0]
  const distanceKm = route.distance / 1000

  // Override duration for non-driving modes (OSRM foot/bike may be inaccurate for TW)
  const speeds: Record<string, number> = { walk: 5, bike: 15, bus: 20 }
  const durationSec = speeds[mode]
    ? (distanceKm / speeds[mode]) * 3600
    : route.duration

  return {
    distance: distanceKm,
    duration: durationSec,
    geometry: route.geometry,
  }
})
