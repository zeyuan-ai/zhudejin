import { demoListings } from '../data'
import { rankListings } from '../lib/recommend'
import { AppError, type SearchPreferences, type SearchResponse, type WorkLocation } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
export const dataMode = (import.meta.env.VITE_DATA_MODE || 'staging') as 'staging' | 'production'
export const isLiveMode = Boolean(supabaseUrl && publishableKey)

const invoke = async <T>(name: string, body: unknown, sessionToken?: string): Promise<T> => {
  if (!isLiveMode) throw new AppError('NETWORK_ERROR', '当前未配置在线服务')
  const response = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: publishableKey, ...(sessionToken ? { 'x-invite-session': sessionToken } : {}) },
    body: JSON.stringify(body),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new AppError(payload.code || 'UNKNOWN', payload.message || '服务暂时不可用')
  return payload as T
}

export const validateInvite = async (code: string) => {
  if (!isLiveMode) return { sessionToken: 'demo-session', expiresAt: new Date(Date.now() + 7 * 86400000).toISOString() }
  return invoke<{ sessionToken: string; expiresAt: string }>('validate-invite', { code })
}

export const searchListings = async (office: WorkLocation, preferences: SearchPreferences, sessionToken?: string): Promise<SearchResponse> => {
  if (!isLiveMode) {
    if (dataMode === 'production') throw new AppError('NETWORK_ERROR', '正式环境未连接真实数据服务，已禁止使用模拟数据')
    await new Promise((resolve) => window.setTimeout(resolve, 350))
    const results = rankListings(demoListings, preferences)
    return { results, mode: 'demo', searchedAt: new Date().toISOString(), candidateCount: demoListings.length, groupCounts: { real: 0, synthetic: results.length, fallback: 0 } }
  }
  const response = await invoke<SearchResponse>('search-listings', { office, preferences }, sessionToken)
  if (dataMode === 'production' && (response.mode !== 'production' || response.results.some(({ listing }) => listing.dataOrigin !== 'real'))) {
    throw new AppError('UNKNOWN', '正式环境检测到非真实数据，已阻止展示')
  }
  return response
}

export const submitFeedback = async (helpful: boolean, resultIds: string[], sessionToken?: string) => {
  if (!isLiveMode) return { ok: true }
  return invoke<{ ok: true }>('submit-feedback', { helpful, resultIds }, sessionToken)
}
