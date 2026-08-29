export type SyntheticRegion = 'hongqiao' | 'lujiazui' | 'peoples-square' | 'xujiahui' | 'zhangjiang'

export const stagingOffices = [
  { id: 'hongqiao', name: '上海虹桥商务区', subtitle: '长宁区 · 闵行区交界', coords: [31.1979, 121.3211] },
  { id: 'lujiazui', name: '陆家嘴金融城', subtitle: '浦东新区 · 陆家嘴', coords: [31.2397, 121.4998] },
  { id: 'peoples-square', name: '人民广场', subtitle: '黄浦区 · 人民广场', coords: [31.2304, 121.4737] },
  { id: 'xujiahui', name: '徐家汇商圈', subtitle: '徐汇区 · 徐家汇', coords: [31.1885, 121.4365] },
  { id: 'zhangjiang', name: '张江科学城', subtitle: '浦东新区 · 张江', coords: [31.2036, 121.6014] },
] as const

export type SyntheticRoute = {
  id: string; mode: string; strategy: string; time: number; transfers: number; walk: number
  cost: number; reliability: number; summary: string; period: 'morning-peak' | 'off-peak' | 'evening-peak'; synthetic: true
}

const hash = (value: string) => [...value].reduce((total, char) => ((total * 31) + char.charCodeAt(0)) >>> 0, 2166136261)

export const trafficPeriod = (arrivalTime = '09:00') => {
  const [hour, minute] = arrivalTime.split(':').map(Number)
  const value = hour * 60 + minute
  if (value >= 7 * 60 && value <= 9 * 60 + 30) return 'morning-peak' as const
  if (value >= 17 * 60 && value <= 19 * 60 + 30) return 'evening-peak' as const
  return 'off-peak' as const
}

export const resolveStagingOffice = (idOrName: string) => stagingOffices.find((office) => office.id === idOrName || office.name === idOrName)

export function selectNearestListings<T extends { latitude: number; longitude: number }>(listings: T[], destination: number[], limit = 12): T[] {
  const [latitude, longitude] = destination
  const longitudeScale = Math.cos(latitude * Math.PI / 180)
  return [...listings].sort((left, right) => {
    const leftDistance = (left.latitude - latitude) ** 2 + ((left.longitude - longitude) * longitudeScale) ** 2
    const rightDistance = (right.latitude - latitude) ** 2 + ((right.longitude - longitude) * longitudeScale) ** 2
    return leftDistance - rightDistance
  }).slice(0, limit)
}

export function createSyntheticRoutes(listingId: string, transport: string, arrivalTime = '09:00'): SyntheticRoute[] {
  const seed = hash(`${listingId}|${transport}`)
  const period = trafficPeriod(arrivalTime)
  const peak = period === 'off-peak' ? 1 : period === 'morning-peak' ? 1.16 : 1.12
  const label = period === 'morning-peak' ? '早高峰' : period === 'evening-peak' ? '晚高峰' : '平峰'
  const make = (strategy: string, time: number, transfers: number, walk: number, cost: number, reliability: number, summary: string): SyntheticRoute => ({
    id: `synthetic-${listingId}-${transport}-${strategy}-${period}`, mode: transport, strategy,
    time: Math.round(time), transfers, walk, cost, reliability, summary: `${label} · ${summary}`, period, synthetic: true,
  })
  if (transport === '公共交通') {
    const fastest = Math.round((25 + seed % 18) * peak)
    const transfers = 1 + seed % 2
    const walk = 7 + seed % 8
    return [
      make('fastest', fastest, transfers, walk, 4 + seed % 4, 84, '地铁与公交组合最快路线'),
      make('least-transfer', fastest + 6 + seed % 5, Math.max(0, transfers - 1), walk + 2, 4 + seed % 4, 90, '少换乘方案'),
      make('least-walk', fastest + 4 + seed % 4, transfers, Math.max(3, walk - 5), 5 + seed % 4, 87, '缩短步行距离'),
      make('metro-first', fastest + 2 + seed % 3, Math.max(1, transfers), Math.max(5, walk - 2), 5 + seed % 3, 89, '地铁优先方案'),
      make('avoid-metro', fastest + 8 + seed % 6, Math.max(0, transfers - 1), walk + 1, 3 + seed % 3, 76, '公交为主，避开地铁'),
    ]
  }
  if (transport === '驾车') return [make('fastest', (18 + seed % 24) * (period === 'off-peak' ? 1 : 1.35), 0, 1, 6 + seed % 16, 68, '工作日道路估算')]
  if (transport === '骑行') return [make('fastest', (22 + seed % 31) * (period === 'off-peak' ? 1 : 1.03), 0, 1, 0, 81, '城市道路骑行')]
  return [make('fastest', 36 + seed % 12, 0, 0, 0, 90, '全程步行')]
}
