import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'
import { adminClient, sha256 } from '../_shared/supabase.ts'

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const generateCode = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(15))
  const value = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('')
  return `ZD-${value.slice(0, 5)}-${value.slice(5, 10)}-${value.slice(10)}`
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
      const { data, error } = await client.from('invite_codes').select('id,label,expires_at,daily_limit,is_active,created_at').order('created_at', { ascending: false })
      if (error) throw error
      return json({ invites: data })
    }
    if (body.action === 'create') {
      const label = typeof body.label === 'string' ? body.label.trim() : ''
      const dailyLimit = Number(body.dailyLimit)
      const expiresAt = new Date(body.expiresAt)
      if (label.length < 2 || label.length > 50) return json({ code: 'INVALID_INPUT', message: '用途标签需要 2–50 个字符' }, 400)
      if (!Number.isInteger(dailyLimit) || dailyLimit < 1 || dailyLimit > 100) return json({ code: 'INVALID_INPUT', message: '每日限额需要在 1–100 次之间' }, 400)
      if (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) return json({ code: 'INVALID_INPUT', message: '有效期必须晚于当前时间' }, 400)
      const code = generateCode()
      const codeHash = await sha256(code)
      const { data, error } = await client.from('invite_codes').insert({ label, code_hash: codeHash, expires_at: expiresAt.toISOString(), daily_limit: dailyLimit, is_active: true }).select('id,label,expires_at,daily_limit,is_active,created_at').single()
      if (error) throw error
      return json({ invite: data, code })
    }
    if (body.action === 'status') {
      if (typeof body.id !== 'string' || typeof body.isActive !== 'boolean') return json({ code: 'INVALID_INPUT', message: '邀请码状态参数无效' }, 400)
      const { data, error } = await client.from('invite_codes').update({ is_active: body.isActive }).eq('id', body.id).select('id,label,expires_at,daily_limit,is_active,created_at').single()
      if (error) throw error
      return json({ invite: data })
    }
    if (body.action === 'delete') {
      if (typeof body.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.id)) return json({ code: 'INVALID_INPUT', message: '邀请码编号无效' }, 400)
      const { data, error } = await client.from('invite_codes').delete().eq('id', body.id).select('id,label').maybeSingle()
      if (error) throw error
      if (!data) return json({ code: 'NOT_FOUND', message: '邀请码不存在或已被删除' }, 404)
      return json({ deleted: true, invite: data })
    }
    return json({ code: 'INVALID_INPUT', message: '不支持的邀请码操作' }, 400)
  } catch (error) {
    const issue = error as Error; console.error(issue.message)
    return json({ code: 'UNKNOWN', message: '邀请码管理服务暂时不可用' }, 500)
  }
})
