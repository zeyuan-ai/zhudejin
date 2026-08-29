import type { CommuteOption, HousingListing, RankedListing, SearchPreferences } from '../types'

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const round = (value: number) => Math.round(value * 10) / 10

export const matchesHardFilters = (listing: HousingListing, preferences: SearchPreferences) => {
  const routes = listing.commute[preferences.transport]
  const fastest = routes?.reduce((best, route) => route.time < best.time ? route : best, routes[0])
  return listing.status === 'active'
    && listing.rent <= preferences.budget
    && (preferences.rentalType === '全部' || listing.rentalType === preferences.rentalType)
    && (preferences.bedroomCount === 0 || (preferences.bedroomCount >= 3 ? listing.bedroomCount >= 3 : listing.bedroomCount === preferences.bedroomCount))
    && listing.area >= preferences.minArea
    && (preferences.maxStationWalkMinutes === 0 || listing.stationWalkMinutes <= preferences.maxStationWalkMinutes)
    && Boolean(fastest)
    && (preferences.commuteMode === 'arrival' || fastest.time <= preferences.commuteLimit)
}

export const selectRoute = (listing: HousingListing, preferences: SearchPreferences): CommuteOption => {
  const routes = listing.commute[preferences.transport]
  if (!routes?.length) throw new Error(`房源 ${listing.id} 缺少 ${preferences.transport} 路线`)
  const fastest = [...routes].sort((a, b) => a.time - b.time)[0]
  if (preferences.transport !== '公共交通' || preferences.routeStrategy === 'fastest') return fastest
  const preferred = routes.filter((route) => route.strategy === preferences.routeStrategy)
  if (preferred.length) return [...preferred].sort((a, b) => a.time - b.time)[0]
  if (preferences.routeStrategy === 'least-transfer') return [...routes].sort((a, b) => a.transfers - b.transfers || a.time - b.time)[0]
  if (preferences.routeStrategy === 'least-walk') return [...routes].sort((a, b) => a.walk - b.walk || a.time - b.time)[0]
  return fastest
}

export const getCommuteWeights = (timeComfort: number) => {
  const s = clamp(timeComfort / 100)
  return { time: 20 + 20 * s, transfers: 20 - 10 * s, walk: 15 - 10 * s, cost: 5 }
}

export const rankListings = (listings: HousingListing[], preferences: SearchPreferences): RankedListing[] => {
  const weights = getCommuteWeights(preferences.timeComfort)
  return listings.filter((listing) => matchesHardFilters(listing, preferences)).slice(0, 12).map((listing) => {
    const commute = selectRoute(listing, preferences)
    const fastestCommute = [...listing.commute[preferences.transport]].sort((a, b) => a.time - b.time)[0]
    const budget = 25 * clamp(1 - listing.rent / Math.max(preferences.budget, 1) * 0.45)
    const areaTarget = Math.max(preferences.minArea || 35, 35)
    const area = 5 * clamp(listing.area / (areaTarget * 1.35))
    const station = 10 * clamp(1 - listing.stationWalkMinutes / 25)
    const time = weights.time * clamp(1 - commute.time / Math.max(preferences.commuteLimit * 1.6, 45))
    const transfers = weights.transfers * clamp(1 - commute.transfers / 3)
    const walk = weights.walk * clamp(1 - commute.walk / 30)
    const cost = weights.cost * clamp(1 - commute.cost / 15)
    const breakdown = { budget: round(budget), area: round(area), station: round(station), time: round(time), transfers: round(transfers), walk: round(walk), cost: round(cost) }
    const score = Math.round(Object.values(breakdown).reduce((sum, value) => sum + value, 0))
    const reasons: string[] = []
    const delay = commute.time - fastestCommute.time
    const savedTransfers = fastestCommute.transfers - commute.transfers
    if (delay > 0 && delay <= 10 && savedTransfers > 0) reasons.push(`比最快方案慢 ${delay} 分钟，但少换乘 ${savedTransfers} 次`)
    if (commute.transfers === 0) reasons.push('全程无需换乘，通勤更省心')
    if (listing.rent <= preferences.budget * 0.8) reasons.push(`月租比预算低 ¥${(preferences.budget - listing.rent).toLocaleString()}`)
    if (listing.stationWalkMinutes <= 5) reasons.push(`步行约 ${listing.stationWalkMinutes} 分钟到 ${listing.station}`)
    if (preferences.commuteMode === 'arrival') {
      const [hour, minute] = preferences.arrivalTime.split(':').map(Number)
      const departure = (hour * 60 + minute - commute.time + 1440) % 1440
      reasons.unshift(`要在 ${preferences.arrivalTime} 到达，建议 ${String(Math.floor(departure / 60)).padStart(2, '0')}:${String(departure % 60).padStart(2, '0')} 前出发`)
    }
    if (!reasons.length) reasons.push(`${commute.time} 分钟到公司，预算与空间较均衡`)
    const label = commute.transfers === 0 ? '少换乘优先' : listing.rent <= preferences.budget * 0.8 ? '预算友好' : '综合平衡'
    return { listing, commute, fastestCommute, score: Math.min(100, score), breakdown, reasons, label }
  }).sort((a, b) => b.score - a.score).slice(0, 10)
}
