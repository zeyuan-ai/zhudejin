import { createClient } from 'npm:@supabase/supabase-js@2'

const getSecretKey = () => {
  const modern = Deno.env.get('SUPABASE_SECRET_KEYS')
  if (modern) return JSON.parse(modern).default
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
}

export const adminClient = () => createClient(Deno.env.get('SUPABASE_URL')!, getSecretKey(), { auth: { persistSession: false } })
export const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}
