import { useEffect, useState } from 'react'
import { Home, LogOut, Pencil, Plus, RefreshCw, Save, X } from 'lucide-react'
import { invokeAdmin, supabase } from '../services/supabase'
import { InviteManager } from './InviteManager'

type Status = 'active' | 'inactive' | 'expired'
type AdminListing = {
  id: string; title: string; district: string; address: string; latitude: number; longitude: number; rent: number
  rental_type: '整租' | '合租'; bedroom_count: number; bedrooms: string; area: number; image_url: string | null
  station: string; station_walk_minutes: number; build_year: number | null; highlights: string[]; tags: string[]
  description: string; source_name: string; source_url: string; source_updated_at: string; expires_at: string | null; status: Status
}
type FormState = Omit<AdminListing, 'id' | 'highlights' | 'tags'> & { id?: string; highlights: string; tags: string }

const today = () => new Date().toISOString().slice(0, 10)
const emptyForm = (): FormState => ({
  title: '', district: '', address: '', latitude: 31.2304, longitude: 121.4737, rent: 4500,
  rental_type: '整租', bedroom_count: 1, bedrooms: '一室一厅', area: 35, image_url: '', station: '',
  station_walk_minutes: 8, build_year: null, highlights: '', tags: '', description: '', source_name: '',
  source_url: '', source_updated_at: today(), expires_at: null, status: 'inactive',
})
const toForm = (listing: AdminListing): FormState => ({ ...listing, highlights: listing.highlights.join('，'), tags: listing.tags.join('，'), source_updated_at: listing.source_updated_at.slice(0, 10), expires_at: listing.expires_at?.slice(0, 10) || null })
const splitList = (value: string) => value.split(/[，,]/).map((item) => item.trim()).filter(Boolean)

export function AdminPage() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [loggedIn, setLoggedIn] = useState(false)
  const [listings, setListings] = useState<AdminListing[]>([]); const [error, setError] = useState(''); const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormState | null>(null)
  const load = async () => { setLoading(true); setError(''); try { const data = await invokeAdmin({ action: 'list' }); setListings(data.listings) } catch (reason) { setError(reason instanceof Error ? reason.message : '加载失败') } finally { setLoading(false) } }
  useEffect(() => { supabase?.auth.getSession().then(({ data }) => { if (data.session) { setLoggedIn(true); load() } }) }, [])
  const login = async (event: React.FormEvent) => { event.preventDefault(); if (!supabase) return setError('尚未配置 Supabase'); setLoading(true); const { error: authError } = await supabase.auth.signInWithPassword({ email, password }); setLoading(false); if (authError) return setError(authError.message); setLoggedIn(true); load() }
  const setStatus = async (id: string, status: Status) => { try { await invokeAdmin({ action: 'status', id, status }); await load() } catch (reason) { setError(reason instanceof Error ? reason.message : '更新失败') } }
  const field = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => current ? { ...current, [key]: value } : current)
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); if (!form) return; setLoading(true); setError('')
    try {
      await invokeAdmin({ action: 'upsert', listing: { ...form, image_url: form.image_url || null, highlights: splitList(form.highlights), tags: splitList(form.tags), expires_at: form.expires_at || null } })
      setForm(null); await load()
    } catch (reason) { setError(reason instanceof Error ? reason.message : '保存失败') } finally { setLoading(false) }
  }
  if (!loggedIn) return <div className="admin-shell"><form className="admin-login" onSubmit={login}><div className="brand-mark"><Home /></div><p className="eyebrow">OPERATIONS</p><h1>房源管理</h1><input type="email" placeholder="管理员邮箱" value={email} onChange={(event) => setEmail(event.target.value)} required /><input type="password" placeholder="密码" value={password} onChange={(event) => setPassword(event.target.value)} required /><button disabled={loading}>{loading ? '登录中…' : '登录'}</button>{error && <p className="form-error">{error}</p>}</form></div>
  return <div className="admin-page"><header><div className="brand-lockup"><div className="brand-mark"><Home size={18} /></div><div><strong>住得近运营台</strong><span>LISTING OPERATIONS</span></div></div><div><button onClick={load}><RefreshCw size={15} /> 刷新</button><button onClick={() => supabase?.auth.signOut().then(() => setLoggedIn(false))}><LogOut size={15} /> 退出</button></div></header><main><InviteManager /><div className="admin-heading"><div><p className="eyebrow">LISTINGS</p><h1>房源管理</h1><p>在站内新增、编辑、审核和上下架房源；新房源默认先保存为待审核。</p></div><button className="admin-primary" onClick={() => setForm(emptyForm())}><Plus size={15} /> 新增房源</button></div>{error && <p className="admin-error">{error}</p>}
  {form && <form className="listing-editor" onSubmit={save}><header><div><p className="eyebrow">{form.id ? 'EDIT LISTING' : 'NEW LISTING'}</p><h2>{form.id ? '编辑房源' : '新增房源'}</h2></div><button type="button" onClick={() => setForm(null)} aria-label="关闭"><X /></button></header><div className="editor-grid">
    <label className="wide">房源标题<input value={form.title} onChange={(e) => field('title', e.target.value)} required /></label><label>区域<input value={form.district} onChange={(e) => field('district', e.target.value)} required /></label><label>租赁类型<select value={form.rental_type} onChange={(e) => field('rental_type', e.target.value as FormState['rental_type'])}><option>整租</option><option>合租</option></select></label>
    <label className="wide">详细地址<input value={form.address} onChange={(e) => field('address', e.target.value)} required /></label><label>纬度<input type="number" step="any" value={form.latitude} onChange={(e) => field('latitude', Number(e.target.value))} required /></label><label>经度<input type="number" step="any" value={form.longitude} onChange={(e) => field('longitude', Number(e.target.value))} required /></label>
    <label>月租<input type="number" min="1" value={form.rent} onChange={(e) => field('rent', Number(e.target.value))} required /></label><label>面积（㎡）<input type="number" min="1" step="0.1" value={form.area} onChange={(e) => field('area', Number(e.target.value))} required /></label><label>卧室数<input type="number" min="1" value={form.bedroom_count} onChange={(e) => field('bedroom_count', Number(e.target.value))} required /></label><label>户型描述<input value={form.bedrooms} onChange={(e) => field('bedrooms', e.target.value)} required /></label>
    <label>附近地铁站<input value={form.station} onChange={(e) => field('station', e.target.value)} required /></label><label>步行分钟<input type="number" min="0" value={form.station_walk_minutes} onChange={(e) => field('station_walk_minutes', Number(e.target.value))} required /></label><label>建成年份<input type="number" value={form.build_year ?? ''} onChange={(e) => field('build_year', e.target.value ? Number(e.target.value) : null)} /></label><label>状态<select value={form.status} onChange={(e) => field('status', e.target.value as Status)}><option value="inactive">待审核</option><option value="active">已上架</option><option value="expired">已过期</option></select></label>
    <label className="wide">图片地址<input type="url" value={form.image_url || ''} onChange={(e) => field('image_url', e.target.value)} /></label><label className="wide">亮点（逗号分隔）<input value={form.highlights} onChange={(e) => field('highlights', e.target.value)} /></label><label className="wide">标签（逗号分隔）<input value={form.tags} onChange={(e) => field('tags', e.target.value)} /></label><label className="full">房源描述<textarea rows={3} value={form.description} onChange={(e) => field('description', e.target.value)} /></label>
    <label>来源名称<input value={form.source_name} onChange={(e) => field('source_name', e.target.value)} required /></label><label className="wide">来源链接<input type="url" value={form.source_url} onChange={(e) => field('source_url', e.target.value)} required /></label><label>来源更新时间<input type="date" value={form.source_updated_at} onChange={(e) => field('source_updated_at', e.target.value)} required /></label><label>到期日期<input type="date" value={form.expires_at || ''} onChange={(e) => field('expires_at', e.target.value || null)} /></label>
  </div><footer><button type="button" onClick={() => setForm(null)}>取消</button><button className="save" disabled={loading}><Save size={14} />{loading ? '保存中…' : '保存房源'}</button></footer></form>}
  <div className="admin-table"><div className="admin-row head"><span>房源</span><span>租赁</span><span>租金 / 面积</span><span>来源更新</span><span>状态</span><span>操作</span></div>{listings.map((listing) => <div className="admin-row" key={listing.id}><span><strong>{listing.title}</strong><small>{listing.district}</small></span><span>{listing.rental_type}</span><span>¥{listing.rent} · {listing.area}㎡</span><span>{listing.source_name}<small>{listing.source_updated_at?.slice(0, 10)}</small></span><span><i className={`status-dot ${listing.status}`} />{listing.status}</span><span className="admin-row-actions"><button onClick={() => setForm(toForm(listing))}><Pencil size={12} />编辑</button><button onClick={() => setStatus(listing.id, listing.status === 'active' ? 'inactive' : 'active')}>{listing.status === 'active' ? '下架' : '上架'}</button></span></div>)}</div>{!loading && listings.length === 0 && <p className="admin-loading">还没有房源，点击“新增房源”录入第一套。</p>}{loading && <p className="admin-loading">正在加载房源…</p>}</main></div>
}
