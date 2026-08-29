import { useState } from 'react'
import { Check, ExternalLink, KeyRound, Server, ShieldCheck, X } from 'lucide-react'
import { getAmapBrowserConfig } from '../services/amap'
import { isLiveMode } from '../services/api'

export function ApiSetupPanel({ onClose }: { onClose: () => void }) {
  const current = getAmapBrowserConfig()
  const [key, setKey] = useState(current.key)
  const [securityCode, setSecurityCode] = useState(current.securityCode)
  const save = () => { localStorage.setItem('zhudejin-amap-js-key', key.trim()); localStorage.setItem('zhudejin-amap-security-code', securityCode.trim()); window.location.reload() }
  const clear = () => { localStorage.removeItem('zhudejin-amap-js-key'); localStorage.removeItem('zhudejin-amap-security-code'); window.location.reload() }
  return <div className="api-backdrop" role="dialog" aria-modal="true" aria-label="API 配置"><section className="api-panel"><header><div><p className="eyebrow"><KeyRound size={13} /> API SETUP</p><h2>连接真实地图与后端</h2></div><button className="icon-button" onClick={onClose} aria-label="关闭 API 配置"><X /></button></header>
    <div className="api-status-row"><span className={current.key ? 'connected' : ''}>{current.key ? <Check /> : <KeyRound />}高德地图 {current.key ? '已配置' : '未配置'}</span><span className={isLiveMode ? 'connected' : ''}>{isLiveMode ? <Check /> : <Server />}Supabase {isLiveMode ? '已配置' : '演示模式'}</span></div>
    <div className="api-safe-box"><ShieldCheck /><div><strong>这里仅填写浏览器端配置</strong><p>内容只保存在这台电脑的浏览器 localStorage，不会写入项目文件或上传 GitHub。高德 JS Key 本身会出现在浏览器中，务必在高德控制台限制允许域名。</p></div></div>
    <label>高德 Web 端（JS API）Key<input type="password" value={key} onChange={(event) => setKey(event.target.value)} placeholder="在高德开放平台申请 Web 端 JS API Key" /></label>
    <label>高德安全密钥 securityJsCode<input type="password" value={securityCode} onChange={(event) => setSecurityCode(event.target.value)} placeholder="2021 年后申请的 Key 通常需要" /></label>
    <div className="api-actions"><button className="secondary" onClick={clear}>清除本机配置</button><button onClick={save} disabled={!key.trim()}>保存并刷新地图</button></div>
    <div className="server-secret-note"><Server /><div><strong>服务端密钥不能在这里填写</strong><p>高德 Web 服务 Key、百度 AK、Supabase secret key 应通过 <code>supabase secrets set</code> 配置。完整步骤见项目中的 <code>docs/SUPABASE_SETUP.md</code>。</p><a href="https://console.amap.com/dev/key/app" target="_blank" rel="noreferrer">打开高德控制台 <ExternalLink size={13} /></a></div></div>
  </section></div>
}
