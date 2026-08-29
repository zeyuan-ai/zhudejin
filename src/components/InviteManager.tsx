import { useEffect, useState } from 'react'
import { Check, Copy, KeyRound, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { invokeInvites } from '../services/supabase'

type Invite = { id: string; label: string; expires_at: string; daily_limit: number; is_active: boolean; created_at: string }
const defaultExpiry = () => { const date = new Date(); date.setDate(date.getDate() + 30); return date.toISOString().slice(0, 10) }

export function InviteManager() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [label, setLabel] = useState(''); const [expiresAt, setExpiresAt] = useState(defaultExpiry); const [dailyLimit, setDailyLimit] = useState(10)
  const [createdCode, setCreatedCode] = useState(''); const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false); const [deletingId, setDeletingId] = useState(''); const [error, setError] = useState('')
  const load = async () => { try { const data = await invokeInvites({ action: 'list' }); setInvites(data.invites) } catch (reason) { setError(reason instanceof Error ? reason.message : '邀请码加载失败') } }
  useEffect(() => { load() }, [])
  const create = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setError(''); setCreatedCode('')
    try {
      const data = await invokeInvites({ action: 'create', label, expiresAt: new Date(`${expiresAt}T23:59:59+08:00`).toISOString(), dailyLimit })
      setCreatedCode(data.code); setLabel(''); setCopied(false); await load()
    } catch (reason) { setError(reason instanceof Error ? reason.message : '邀请码创建失败') } finally { setLoading(false) }
  }
  const copy = async () => { await navigator.clipboard.writeText(createdCode); setCopied(true) }
  const setStatus = async (invite: Invite) => { setError(''); try { await invokeInvites({ action: 'status', id: invite.id, isActive: !invite.is_active }); await load() } catch (reason) { setError(reason instanceof Error ? reason.message : '邀请码状态更新失败') } }
  const remove = async (invite: Invite) => {
    const confirmed = window.confirm(`确定永久删除“${invite.label}”吗？\n\n删除后无法恢复，该邀请码产生的所有登录会话会立即失效。`)
    if (!confirmed) return
    setDeletingId(invite.id); setError('')
    try { await invokeInvites({ action: 'delete', id: invite.id }); await load() }
    catch (reason) { setError(reason instanceof Error ? reason.message : '邀请码删除失败') }
    finally { setDeletingId('') }
  }
  return <section className="invite-manager" aria-labelledby="invite-title"><header><div><p className="eyebrow">PRIVATE BETA ACCESS</p><h1 id="invite-title">邀请码管理</h1><p>明文只在创建时显示一次；列表与数据库都不会保存或返回原邀请码。</p></div><ShieldCheck /></header>
    <form className="invite-create" onSubmit={create}><label>使用人或用途<input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="例如：小李内测" minLength={2} maxLength={50} required /></label><label>有效期<input type="date" value={expiresAt} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setExpiresAt(event.target.value)} required /></label><label>每日搜索上限<input type="number" min="1" max="100" value={dailyLimit} onChange={(event) => setDailyLimit(Number(event.target.value))} required /></label><button disabled={loading}><Plus size={14} />{loading ? '生成中…' : '生成邀请码'}</button></form>
    {error && <p className="admin-error">{error}</p>}
    {createdCode && <div className="invite-once" role="alert"><KeyRound /><div><strong>请立即复制，这个邀请码关闭后无法找回</strong><code>{createdCode}</code></div><button onClick={copy}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? '已复制' : '复制邀请码'}</button><button className="dismiss" onClick={() => setCreatedCode('')}>我已保存</button></div>}
    <div className="invite-list"><div className="invite-row head"><span>标签</span><span>有效期</span><span>每日限额</span><span>状态</span><span>操作</span></div>{invites.map((invite) => <div className="invite-row" key={invite.id}><span><strong>{invite.label}</strong><small>创建于 {invite.created_at.slice(0, 10)}</small></span><span>{invite.expires_at.slice(0, 10)}</span><span>{invite.daily_limit} 次</span><span><i className={`status-dot ${invite.is_active ? 'active' : ''}`} />{invite.is_active ? '启用' : '停用'}</span><span className="invite-actions"><button disabled={deletingId === invite.id} onClick={() => setStatus(invite)}>{invite.is_active ? '停用' : '重新启用'}</button><button className="delete-invite" disabled={deletingId === invite.id} onClick={() => remove(invite)}><Trash2 size={12} />{deletingId === invite.id ? '删除中…' : '删除'}</button></span></div>)}</div>
    {!loading && invites.length === 0 && <p className="admin-loading">尚未创建邀请码。</p>}
  </section>
}
