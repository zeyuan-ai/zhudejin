import { corsHeaders, json } from '../_shared/cors.ts'
import { adminClient, sha256 } from '../_shared/supabase.ts'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { code } = await request.json()
    if (typeof code !== 'string' || code.trim().length < 6) return json({ code: 'INVITE_REQUIRED', message: '请输入有效邀请码' }, 400)
    const client = adminClient()
    const codeHash = await sha256(code.trim())
    const { data: invite } = await client.from('invite_codes').select('id').eq('code_hash', codeHash).eq('is_active', true).gt('expires_at', new Date().toISOString()).maybeSingle()
    if (!invite) return json({ code: 'INVITE_REQUIRED', message: '邀请码无效或已过期' }, 401)
    const raw = crypto.randomUUID() + crypto.randomUUID()
    const tokenHash = await sha256(raw)
    const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString()
    const { error } = await client.from('invite_sessions').insert({ invite_id: invite.id, token_hash: tokenHash, expires_at: expiresAt })
    if (error) throw error
    return json({ sessionToken: raw, expiresAt })
  } catch (error) { console.error(error); return json({ code: 'UNKNOWN', message: '邀请码服务暂时不可用' }, 500) }
})
