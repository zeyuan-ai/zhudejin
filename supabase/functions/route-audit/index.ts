import { corsHeaders, json } from '../_shared/cors.ts'
import { adminClient } from '../_shared/supabase.ts'

const firstNumber = (value: unknown) => Number(typeof value === 'object' && value && 'value' in value ? (value as any).value : value || 0)

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) return json({ code: 'UNAUTHORIZED', message: '未授权' }, 401)
  const baiduKey = Deno.env.get('BAIDU_WEB_SERVICE_KEY')
  if (!baiduKey) return json({ code: 'MISSING_CONFIG', message: '未配置百度 Web 服务 Key' }, 503)
  const client = adminClient()
  const { data: caches, error } = await client.from('route_cache').select('*').eq('transport', '公共交通').gt('expires_at', new Date().toISOString()).limit(400)
  if (error) return json({ code: 'DATABASE_ERROR', message: error.message }, 500)
  const selected = (caches || []).filter(() => Math.random() < .05).slice(0, 20)
  const audits = []
  for (const cache of selected) {
    try {
      const [originLat, originLng] = cache.origin; const [destLat, destLng] = cache.destination
      const params = new URLSearchParams({ origin: `${originLat},${originLng}`, destination: `${destLat},${destLng}`, coord_type: 'gcj02', ret_coordtype: 'gcj02', tactics_incity: '0', ak: baiduKey })
      const response = await fetch(`https://api.map.baidu.com/direction/v2/transit?${params}`); const payload = await response.json()
      if (!response.ok || payload.status !== 0) throw new Error(payload.message || '百度路线请求失败')
      const baidu = payload.result?.routes?.[0]; if (!baidu) throw new Error('百度未返回路线')
      const amap = [...cache.route_options].sort((a: any, b: any) => a.time - b.time)[0]
      const time = Math.ceil(firstNumber(baidu.duration) / 60)
      const transfers = Math.max(0, (baidu.steps || []).filter((step: any) => /BUS|SUBWAY|地铁|公交/i.test(JSON.stringify(step))).length - 1)
      const walkMeters = firstNumber(baidu.walking_distance)
      const timeDiff = Math.abs(amap.time - time); const ratio = timeDiff / Math.max(amap.time, 1)
      const transferDiff = Math.abs(amap.transfers - transfers); const walkDiff = Math.abs(amap.walk * 80 - walkMeters)
      audits.push({ cache_key: cache.cache_key, amap_result: amap, baidu_result: { time, transfers, walkMeters }, time_difference_minutes: timeDiff, time_difference_ratio: ratio, transfer_difference: transferDiff, walk_difference_meters: walkDiff, is_flagged: timeDiff > 8 || ratio > .15 || transferDiff > 1 || walkDiff > 500 })
    } catch (reason) { audits.push({ cache_key: cache.cache_key, amap_result: cache.route_options?.[0] || {}, error_message: reason instanceof Error ? reason.message : '核验失败', is_flagged: true }) }
  }
  if (audits.length) await client.from('route_audits').insert(audits)
  return json({ audited: audits.length, flagged: audits.filter((audit) => audit.is_flagged).length })
})
