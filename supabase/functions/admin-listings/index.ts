import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'
import { adminClient } from '../_shared/supabase.ts'

const text = (value: unknown) => typeof value === 'string' ? value.trim() : ''
const number = (value: unknown) => Number(value)
const optionalNumber = (value: unknown) => value === '' || value === null || value === undefined ? null : Number(value)
const stringList = (value: unknown) => Array.isArray(value) ? value.map(text).filter(Boolean) : []

const listingPayload = (input: Record<string, unknown>) => {
  const payload = {
    title: text(input.title), district: text(input.district), address: text(input.address),
    latitude: number(input.latitude), longitude: number(input.longitude), rent: number(input.rent),
    rental_type: text(input.rental_type), bedroom_count: number(input.bedroom_count), bedrooms: text(input.bedrooms),
    area: number(input.area), image_url: text(input.image_url) || null, station: text(input.station),
    station_walk_minutes: number(input.station_walk_minutes), build_year: optionalNumber(input.build_year),
    highlights: stringList(input.highlights), tags: stringList(input.tags), description: text(input.description),
    source_name: text(input.source_name), source_url: text(input.source_url), source_updated_at: text(input.source_updated_at),
    expires_at: text(input.expires_at) || null, status: text(input.status) || 'inactive', updated_at: new Date().toISOString(),
  }
  const required = ['title', 'district', 'address', 'bedrooms', 'station', 'source_name', 'source_url', 'source_updated_at'] as const
  if (required.some((key) => !payload[key])) throw new Error('请填写完整的房源、地址、地铁和来源信息')
  if (!['整租', '合租'].includes(payload.rental_type)) throw new Error('租赁类型无效')
  if (!['active', 'inactive', 'expired'].includes(payload.status)) throw new Error('房源状态无效')
  if (!Number.isFinite(payload.latitude) || payload.latitude < -90 || payload.latitude > 90 || !Number.isFinite(payload.longitude) || payload.longitude < -180 || payload.longitude > 180) throw new Error('房源坐标无效')
  if (![payload.rent, payload.bedroom_count, payload.area].every((value) => Number.isFinite(value) && value > 0) || !Number.isFinite(payload.station_walk_minutes) || payload.station_walk_minutes < 0) throw new Error('租金、户型、面积或地铁步行时间无效')
  if (!/^https?:\/\//i.test(payload.source_url)) throw new Error('来源链接必须以 http:// 或 https:// 开头')
  return payload
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const auth = request.headers.get('Authorization') || ''
    const publishable = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') || '{}').default || Deno.env.get('SUPABASE_ANON_KEY')
    const authClient = createClient(Deno.env.get('SUPABASE_URL')!, publishable, { global: { headers: { Authorization: auth } } })
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return json({ code: 'UNAUTHORIZED', message: '请先登录管理员账号' }, 401)
    const client = adminClient()
    const { data: admin } = await client.from('admins').select('user_id').eq('user_id', user.id).maybeSingle()
    if (!admin) return json({ code: 'FORBIDDEN', message: '当前账号没有管理员权限' }, 403)
    const body = await request.json()
    if (body.action === 'list') {
      const { data, error } = await client.from('listings').select('*').order('updated_at', { ascending: false }); if (error) throw error
      return json({ listings: data })
    }
    if (body.action === 'upsert') {
      const allowed = listingPayload(body.listing || {})
      const record = typeof body.listing?.id === 'string' ? { id: body.listing.id, ...allowed } : allowed
      const { data, error } = await client.from('listings').upsert(record).select().single(); if (error) throw error
      return json({ listing: data })
    }
    if (body.action === 'status') {
      const { data, error } = await client.from('listings').update({ status: body.status, updated_at: new Date().toISOString() }).eq('id', body.id).select().single(); if (error) throw error
      return json({ listing: data })
    }
    return json({ code: 'INVALID_INPUT', message: '不支持的管理操作' }, 400)
  } catch (error) { const issue = error as Error; console.error(issue.message); return json({ code: 'UNKNOWN', message: issue.message || '管理服务暂时不可用' }, 500) }
})
