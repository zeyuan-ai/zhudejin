import { corsHeaders, json } from '../_shared/cors.ts'
import { requireInviteSession } from '../_shared/session.ts'
import { sha256 } from '../_shared/supabase.ts'
import { createSyntheticRoutes, resolveStagingOffice, selectNearestListings } from '../_shared/synthetic.ts'

type Preferences = { budget: number; commuteLimit: number; commuteMode: 'limit' | 'arrival'; arrivalTime: string; transport: string; routeStrategy: string; timeComfort: number; rentalType: string; bedroomCount: number; minArea: number; maxStationWalkMinutes: number }
type Route = { id: string; mode: string; strategy: string; time: number; transfers: number; walk: number; cost: number; reliability: number; summary: string; period?: string; synthetic?: boolean }
const clamp = (value: number) => Math.min(1, Math.max(0, value))
const round = (value: number) => Math.round(value * 10) / 10

const parseTransit = (path: any, index: number): Route => {
  const busLines = (path.segments || []).flatMap((segment: any) => segment.bus?.buslines || [])
  const subwayLines = busLines.filter((line: any) => /地铁|轨道/.test(line.name || ''))
  return { id: `amap-transit-${index}`, mode: '公共交通', strategy: subwayLines.length ? 'metro-first' : 'avoid-metro', time: Math.ceil(Number(path.duration || 0) / 60), transfers: Math.max(0, busLines.length - 1), walk: Math.ceil(Number(path.walking_distance || 0) / 80), cost: Math.round(Number(path.cost || path.transit_cost || 0)), reliability: 85, summary: busLines.map((line: any) => line.name).filter(Boolean).slice(0, 3).join(' → ') || '公共交通路线' }
}
const parseSimple = (path: any, mode: string, index: number): Route => ({ id: `amap-${mode}-${index}`, mode, strategy: 'fastest', time: Math.ceil(Number(path.duration || 0) / 60), transfers: 0, walk: mode === '步行' ? Math.ceil(Number(path.distance || 0) / 80) : 0, cost: mode === '驾车' ? Math.round(Number(path.tolls || 0)) : 0, reliability: mode === '驾车' ? 70 : 84, summary: path.steps?.slice(0, 2).map((step: any) => step.instruction).filter(Boolean).join('；') || `${mode}路线` })

const fetchAmapRoutes = async (origin: number[], destination: number[], transport: string): Promise<Route[]> => {
  const key = Deno.env.get('AMAP_WEB_SERVICE_KEY')
  if (!key) throw Object.assign(new Error('真实路线服务尚未配置，高德 Web 服务 Key 缺失'), { code: 'ROUTE_SERVICE_NOT_CONFIGURED', status: 503 })
  const endpoint = transport === '公共交通' ? 'transit/integrated' : transport === '驾车' ? 'driving' : transport === '骑行' ? 'bicycling' : 'walking'
  const params = new URLSearchParams({ key, origin: `${origin[1]},${origin[0]}`, destination: `${destination[1]},${destination[0]}`, show_fields: 'cost,polyline' })
  if (transport === '公共交通') { params.set('city1', '021'); params.set('city2', '021') }
  const response = await fetch(`https://restapi.amap.com/v5/direction/${endpoint}?${params}`)
  const payload = await response.json()
  if (!response.ok || payload.status !== '1') throw new Error(payload.info || '高德路线计算失败')
  const paths = payload.route?.transits || payload.route?.paths || []
  if (!paths.length) throw new Error('没有可用的通勤路线')
  const routes = paths.map((path: any, index: number) => transport === '公共交通' ? parseTransit(path, index) : parseSimple(path, transport, index)).filter((route: Route) => route.time > 0)
  if (transport === '公共交通') {
    const fastest = [...routes].sort((a, b) => a.time - b.time)[0]; if (fastest) fastest.strategy = 'fastest'
    const transfer = [...routes].sort((a, b) => a.transfers - b.transfers || a.time - b.time)[0]; if (transfer && transfer.id !== fastest?.id) transfer.strategy = 'least-transfer'
    const walk = [...routes].sort((a, b) => a.walk - b.walk || a.time - b.time)[0]; if (walk && !['fastest', 'least-transfer'].includes(walk.strategy)) walk.strategy = 'least-walk'
  }
  return routes
}

const chooseRoute = (routes: Route[], strategy: string) => routes.find((route) => route.strategy === strategy) || (strategy === 'least-transfer' ? [...routes].sort((a, b) => a.transfers - b.transfers || a.time - b.time)[0] : strategy === 'least-walk' ? [...routes].sort((a, b) => a.walk - b.walk || a.time - b.time)[0] : [...routes].sort((a, b) => a.time - b.time)[0])
const hardFilterDifferences = (listing: any, fastest: Route, p: Preferences) => {
  const differences: string[] = []
  if (listing.rent > p.budget) differences.push(`月租高出预算 ¥${listing.rent - p.budget}`)
  if (p.rentalType !== '全部' && listing.rental_type !== p.rentalType) differences.push(`租赁方式为${listing.rental_type}`)
  if (p.bedroomCount > 0 && (p.bedroomCount >= 3 ? listing.bedroom_count < 3 : listing.bedroom_count !== p.bedroomCount)) differences.push(`户型为${listing.bedrooms}`)
  if (Number(listing.area) < p.minArea) differences.push(`面积少 ${p.minArea - Number(listing.area)}㎡`)
  if (p.maxStationWalkMinutes > 0 && listing.station_walk_minutes > p.maxStationWalkMinutes) differences.push(`地铁步行多 ${listing.station_walk_minutes - p.maxStationWalkMinutes} 分钟`)
  if (p.commuteMode === 'limit' && fastest.time > p.commuteLimit) differences.push(`通勤超出 ${fastest.time - p.commuteLimit} 分钟`)
  return differences
}

const rank = (listing: any, routes: Route[], p: Preferences, origin = listing.data_origin || 'real') => {
  const fastest = [...routes].sort((a, b) => a.time - b.time)[0]
  const commute = p.transport === '公共交通' ? chooseRoute(routes, p.routeStrategy) : fastest
  const s = clamp(p.timeComfort / 100); const weights = { time: 20 + 20 * s, transfers: 20 - 10 * s, walk: 15 - 10 * s, cost: 5 }
  const breakdown = { budget: round(25 * clamp(1 - listing.rent / Math.max(p.budget, 1) * .45)), area: round(5 * clamp(Number(listing.area) / (Math.max(p.minArea || 35, 35) * 1.35))), station: round(10 * clamp(1 - listing.station_walk_minutes / 25)), time: round(weights.time * clamp(1 - commute.time / Math.max(p.commuteLimit * 1.6, 45))), transfers: round(weights.transfers * clamp(1 - commute.transfers / 3)), walk: round(weights.walk * clamp(1 - commute.walk / 30)), cost: round(weights.cost * clamp(1 - commute.cost / 15)) }
  const delay = commute.time - fastest.time; const saved = fastest.transfers - commute.transfers; const reasons: string[] = []
  if (delay > 0 && delay <= 10 && saved > 0) reasons.push(`比最快方案慢 ${delay} 分钟，但少换乘 ${saved} 次`)
  if (commute.transfers === 0) reasons.push('全程无需换乘，通勤更省心')
  if (listing.rent <= p.budget * .8) reasons.push(`月租比预算低 ¥${p.budget - listing.rent}`)
  if (listing.station_walk_minutes <= 5) reasons.push(`步行约 ${listing.station_walk_minutes} 分钟到 ${listing.station}`)
  if (p.commuteMode === 'arrival') { const [hour, minute] = p.arrivalTime.split(':').map(Number); const departure = (hour * 60 + minute - commute.time + 1440) % 1440; reasons.unshift(`要在 ${p.arrivalTime} 到达，建议 ${String(Math.floor(departure / 60)).padStart(2, '0')}:${String(departure % 60).padStart(2, '0')} 前出发`) }
  if (!reasons.length) reasons.push(`${commute.time} 分钟到公司，预算与空间较均衡`)
  return { listing: { id: listing.id, title: listing.title, district: listing.district, address: listing.address, coords: [listing.latitude, listing.longitude], rent: listing.rent, rentalType: listing.rental_type, bedroomCount: listing.bedroom_count, bedrooms: listing.bedrooms, area: Number(listing.area), image: listing.image_url || '', station: listing.station, stationWalkMinutes: listing.station_walk_minutes, buildYear: listing.build_year, highlights: listing.highlights || [], tags: listing.tags || [], description: listing.description, sourceName: listing.source_name, sourceUrl: origin === 'real' ? listing.source_url : '', updatedAt: String(listing.source_updated_at || '').slice(0, 10), status: listing.status, commute: { [p.transport]: routes }, dataOrigin: origin, testRegion: listing.test_region || undefined, scenarioTags: listing.scenario_tags || [] }, commute, fastestCommute: fastest, breakdown, score: Math.min(100, Math.round(Object.values(breakdown).reduce((sum, value) => sum + value, 0))), reasons, label: commute.transfers === 0 ? '少换乘优先' : listing.rent <= p.budget * .8 ? '预算友好' : '综合平衡' }
}

async function routesForReal(client: any, listing: any, office: any, p: Preferences) {
  const cacheKey = await sha256(`${office.coords.join(',')}|${listing.latitude},${listing.longitude}|${p.transport}`)
  const { data: cached } = await client.from('route_cache').select('route_options').eq('cache_key', cacheKey).gt('expires_at', new Date().toISOString()).maybeSingle()
  if (cached) return { routes: cached.route_options as Route[], cacheHit: true }
  const routes = await fetchAmapRoutes([listing.latitude, listing.longitude], office.coords, p.transport)
  await client.from('route_cache').upsert({ cache_key: cacheKey, origin: [listing.latitude, listing.longitude], destination: office.coords, transport: p.transport, route_options: routes, expires_at: new Date(Date.now() + 86400000).toISOString() })
  return { routes, cacheHit: false }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const started = Date.now()
  try {
    const { client, session } = await requireInviteSession(request)
    const { office, preferences: p } = await request.json() as { office: { id?: string; name?: string; coords: number[] }; preferences: Preferences }
    if (!office?.coords || !Number.isFinite(p?.budget)) return json({ code: 'INVALID_INPUT', message: '搜索条件不完整' }, 400)
    const mode = Deno.env.get('DATA_MODE') === 'staging' ? 'staging' : 'production'
    const stagingOffice = mode === 'staging' ? resolveStagingOffice(office.id || office.name || '') : undefined

    const now = new Date().toISOString()
    const { data: realListings, error: realError } = await client.from('listings').select('*').eq('status', 'active').eq('data_origin', 'real').or(`expires_at.is.null,expires_at.gt.${now}`).limit(12)
    if (realError) throw realError
    let cacheHits = 0
    const realRanked: any[] = []
    for (const listing of realListings || []) {
      try { const routeResult = await routesForReal(client, listing, office, p); if (routeResult.cacheHit) cacheHits++; const item = rank(listing, routeResult.routes, p, 'real'); if (!hardFilterDifferences(listing, item.fastestCommute, p).length) realRanked.push(item) }
      catch (routeError) { if (mode === 'production') throw routeError; console.warn(`Skipped real listing ${listing.id}: ${(routeError as Error).message}`) }
    }
    realRanked.sort((a, b) => b.score - a.score)

    let syntheticRanked: any[] = []; let fallbackRanked: any[] = []; let syntheticCandidates: any[] = []
    if (mode === 'staging') {
      let syntheticQuery = client.from('listings').select('*').eq('status', 'active').eq('data_origin', 'synthetic').limit(stagingOffice ? 20 : 100)
      if (stagingOffice) syntheticQuery = syntheticQuery.eq('test_region', stagingOffice.id)
      const { data, error } = await syntheticQuery
      if (error) throw error
      syntheticCandidates = stagingOffice ? (data || []) : selectNearestListings(data || [], office.coords, 12)
      const evaluated: Array<{ item: any; differences: string[] }> = []
      for (const listing of syntheticCandidates) {
        try {
          let routes: Route[]
          if (stagingOffice) routes = createSyntheticRoutes(listing.id, p.transport, p.arrivalTime) as Route[]
          else {
            const routeResult = await routesForReal(client, listing, office, p)
            routes = routeResult.routes
            if (routeResult.cacheHit) cacheHits++
            else await new Promise((resolve) => setTimeout(resolve, 360))
          }
          const item = rank(listing, routes, p, 'synthetic')
          evaluated.push({ item, differences: hardFilterDifferences(listing, item.fastestCommute, p) })
        } catch (routeError) { console.warn(`Skipped synthetic listing ${listing.id}: ${(routeError as Error).message}`) }
      }
      syntheticRanked = evaluated.filter(({ differences }) => !differences.length).map(({ item }) => item).sort((a, b) => b.score - a.score).slice(0, 10)
      if (!realRanked.length && !syntheticRanked.length) fallbackRanked = evaluated.sort((a, b) => a.differences.length - b.differences.length || b.item.score - a.item.score).slice(0, 5).map(({ item, differences }) => ({ ...item, listing: { ...item.listing, dataOrigin: 'fallback' }, fallbackDifferences: differences, reasons: [`仅作边界测试：${differences.join('；')}`, ...item.reasons] }))
    }

    const groups = { real: realRanked.slice(0, 10), synthetic: syntheticRanked, fallback: fallbackRanked }
    const results = [...groups.real, ...groups.synthetic, ...groups.fallback]
    await client.from('search_logs').insert({ invite_id: session.invite_id, session_id: session.id, filters: { ...p, office: office.id || office.name, dataMode: mode }, result_count: results.length, duration_ms: Date.now() - started, cache_hits: cacheHits })
    return json({ results, mode, searchedAt: new Date().toISOString(), candidateCount: (realListings?.length || 0) + syntheticCandidates.length, groupCounts: { real: groups.real.length, synthetic: groups.synthetic.length, fallback: groups.fallback.length } })
  } catch (error) { const issue = error as any; console.error(issue.message); return json({ code: issue.code || 'UNKNOWN', message: issue.message || '搜索服务暂时不可用' }, issue.status || 500) }
})
