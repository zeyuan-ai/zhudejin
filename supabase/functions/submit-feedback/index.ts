import { corsHeaders, json } from '../_shared/cors.ts'
import { requireInviteSession } from '../_shared/session.ts'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { client, session } = await requireInviteSession(request)
    const { helpful, resultIds } = await request.json()
    if (typeof helpful !== 'boolean' || !Array.isArray(resultIds)) return json({ code: 'INVALID_INPUT', message: '反馈内容不完整' }, 400)
    const { error } = await client.from('feedback').insert({ session_id: session.id, helpful, result_ids: resultIds.slice(0, 3) })
    if (error) throw error
    return json({ ok: true })
  } catch (error) { const issue = error as any; return json({ code: issue.code || 'UNKNOWN', message: issue.message || '提交失败' }, issue.status || 500) }
})
