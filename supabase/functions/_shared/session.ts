import { adminClient, sha256 } from './supabase.ts'

export const requireInviteSession = async (request: Request) => {
  const token = request.headers.get('x-invite-session')
  if (!token) throw Object.assign(new Error('需要有效的邀请码会话'), { status: 401, code: 'INVITE_REQUIRED' })
  const client = adminClient()
  const tokenHash = await sha256(token)
  const { data: session } = await client.from('invite_sessions').select('id, invite_id, expires_at, invite_codes(daily_limit)').eq('token_hash', tokenHash).gt('expires_at', new Date().toISOString()).maybeSingle()
  if (!session) throw Object.assign(new Error('邀请码会话已过期'), { status: 401, code: 'INVITE_REQUIRED' })
  const minuteAgo = new Date(Date.now() - 60000).toISOString()
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0)
  const [{ count: minuteCount }, { count: dayCount }] = await Promise.all([
    client.from('search_logs').select('*', { count: 'exact', head: true }).eq('session_id', session.id).gte('created_at', minuteAgo),
    client.from('search_logs').select('*', { count: 'exact', head: true }).eq('session_id', session.id).gte('created_at', dayStart.toISOString()),
  ])
  if ((minuteCount || 0) >= 3) throw Object.assign(new Error('搜索太频繁，请一分钟后再试'), { status: 429, code: 'RATE_LIMITED' })
  const dailyLimit = Number((session.invite_codes as any)?.daily_limit || 10)
  if ((dayCount || 0) >= dailyLimit) throw Object.assign(new Error('今天的搜索次数已用完，明天会自动恢复'), { status: 429, code: 'QUOTA_EXCEEDED' })
  return { client, session }
}
