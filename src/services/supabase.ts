import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
export const supabase = url && key ? createClient(url, key) : null

const invokeAuthenticated = async (name: string, body: unknown) => {
  if (!supabase || !url || !key) throw new Error('尚未配置 Supabase')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('管理员登录已过期')
  const response = await fetch(`${url.replace(/\/$/, '')}/functions/v1/${name}`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify(body) })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.message || '管理操作失败')
  return payload
}

export const invokeAdmin = (body: unknown) => invokeAuthenticated('admin-listings', body)
export const invokeInvites = (body: unknown) => invokeAuthenticated('admin-invites', body)
