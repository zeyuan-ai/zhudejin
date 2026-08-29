import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDownUp, Bike, Bus, CarFront, Check, Clock3, Footprints, Heart, Home, KeyRound, MapPin, Menu, Navigation, RotateCcw, Search, SlidersHorizontal, Sparkles, ThumbsDown, ThumbsUp, WalletCards, X } from 'lucide-react'
import { demoListings, demoOffice, routeStrategies, stagingOffices, transportOptions } from './data'
import { rankListings } from './lib/recommend'
import { geocodeShanghaiAddress, hasAmapConfig } from './services/amap'
import { dataMode, isLiveMode, searchListings, submitFeedback, validateInvite } from './services/api'
import type { DataMode, RankedListing, SearchPreferences, SearchResponse, Transport, WorkLocation } from './types'
import { ListingCard } from './components/ListingCard'
import { MapView } from './components/MapView'
import { ComparePanel } from './components/ComparePanel'
import { AdminPage } from './components/AdminPage'
import { ApiSetupPanel } from './components/ApiSetupPanel'
import { ProductSections } from './components/ProductSections'

const transportIcons = { 公共交通: Bus, 驾车: CarFront, 骑行: Bike, 步行: Footprints } as const
const defaultPreferences: SearchPreferences = { budget: 5500, commuteLimit: 50, arrivalTime: '09:00', commuteMode: 'limit', transport: '公共交通', routeStrategy: 'least-transfer', timeComfort: 45, rentalType: '全部', bedroomCount: 0, minArea: 0, maxStationWalkMinutes: 15 }

function InviteGate({ onSuccess }: { onSuccess: (token: string) => void }) {
  const [code, setCode] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false)
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setLoading(true); setError(''); try { const result = await validateInvite(code.trim()); localStorage.setItem('zhudejin-invite-session', result.sessionToken); onSuccess(result.sessionToken) } catch (reason) { setError(reason instanceof Error ? reason.message : '邀请码验证失败') } finally { setLoading(false) } }
  return <div className="invite-gate"><div className="invite-card"><div className="brand-mark"><Home size={20} /></div><p className="eyebrow">PRIVATE BETA</p><h1>欢迎体验住得近</h1><p>输入个人邀请码，开始用工作地点筛选房源。邀请码只用于控制测试名额。</p><form onSubmit={submit}><input value={code} onChange={(event) => setCode(event.target.value)} placeholder="请输入邀请码" aria-label="邀请码" required /><button disabled={loading}>{loading ? '正在验证…' : '进入产品'}</button></form>{error && <p className="form-error">{error}</p>}</div></div>
}

function App() {
  const [preferences, setPreferences] = useState(defaultPreferences)
  const [searchText, setSearchText] = useState(demoOffice.name)
  const [office, setOffice] = useState<WorkLocation>(demoOffice)
  const [results, setResults] = useState<RankedListing[]>(() => rankListings(demoListings, defaultPreferences))
  const [selectedId, setSelectedId] = useState(results[0]?.listing.id || '')
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('zhudejin-favorites') ?? '[]') } catch { return [] } })
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [compareOpen, setCompareOpen] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [resultMode, setResultMode] = useState<DataMode>(isLiveMode ? dataMode : 'demo')
  const [groupCounts, setGroupCounts] = useState<SearchResponse['groupCounts']>({ real: 0, synthetic: results.length, fallback: 0 })
  const [sessionToken, setSessionToken] = useState(() => localStorage.getItem('zhudejin-invite-session') || '')
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [apiSetupOpen, setApiSetupOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => localStorage.setItem('zhudejin-favorites', JSON.stringify(favoriteIds)), [favoriteIds])
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2400) }
  const updatePreference = <K extends keyof SearchPreferences>(key: K, value: SearchPreferences[K]) => setPreferences((current) => ({ ...current, [key]: value }))

  const runSearch = useCallback(async (targetOffice = office, targetPreferences = preferences) => {
    setStatus('loading'); setError(''); setFeedbackSent(false)
    try {
      const response = await searchListings(targetOffice, targetPreferences, sessionToken)
      setResults(response.results); setResultMode(response.mode); setGroupCounts(response.groupCounts); setSelectedId(response.results[0]?.listing.id || ''); setMobileFiltersOpen(false)
    } catch (reason) {
      setStatus('error'); setError(reason instanceof Error ? reason.message : '搜索失败，请稍后重试'); return
    }
    setStatus('idle')
  }, [office, preferences, sessionToken])

  const handleOfficeSearch = async (event: React.FormEvent) => {
    event.preventDefault(); setStatus('loading'); setError('')
    try {
      const amapReady = hasAmapConfig()
      const preset = stagingOffices.find((item) => item.name === searchText.trim() || item.id === searchText.trim())
      if (!preset && !amapReady) throw new Error('搜索任意上海地址需要先配置高德Web端Key；也可以使用下方五个快捷地点')
      const target = preset || (amapReady ? await geocodeShanghaiAddress(searchText.trim()) : demoOffice)
      setSearchText(target.name); setOffice(target); await runSearch(target); if (amapReady) showToast('工作地点已定位')
    } catch (reason) { setStatus('error'); setError(reason instanceof Error ? reason.message : '地址解析失败') }
  }

  const toggleCompare = (id: string) => setCompareIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length >= 3 ? (showToast('最多对比 3 套房源'), current) : [...current, id])
  const selectedItem = results.find((item) => item.listing.id === selectedId)
  const compareItems = results.filter((item) => compareIds.includes(item.listing.id))
  const resultListings = useMemo(() => results.map((item) => item.listing), [results])
  const groupedResults = useMemo(() => ({ real: results.filter((item) => item.listing.dataOrigin === 'real'), synthetic: results.filter((item) => item.listing.dataOrigin === 'synthetic'), fallback: results.filter((item) => item.listing.dataOrigin === 'fallback') }), [results])
  const chooseStagingOffice = (target: WorkLocation) => { setOffice(target); setSearchText(target.name); void runSearch(target) }
  const changeTransport = (transport: Transport) => { const next = { ...preferences, transport }; setPreferences(next); void runSearch(office, next) }

  const sendFeedback = async (helpful: boolean) => { await submitFeedback(helpful, results.slice(0, 3).map((item) => item.listing.id), sessionToken); setFeedbackSent(true); showToast('感谢反馈，这会帮助我们改进排序') }
  if (new URLSearchParams(window.location.search).has('admin')) return <AdminPage />
  if (isLiveMode && !sessionToken) return <InviteGate onSuccess={setSessionToken} />

  return <div className="app-shell">
    <header className="topbar"><div className="brand-lockup"><div className="brand-mark"><Home size={18} /></div><div><strong>住得近</strong><span>WORK TO HOME</span></div></div><nav className="top-nav"><a className="active" href="#explore">工作找房</a><a href="#how">推荐逻辑</a><a href="#about">产品说明</a></nav><div className="top-actions"><button className="api-config-button" onClick={() => setApiSetupOpen(true)}><KeyRound size={14} /> API 配置</button><span className={`mode-badge ${resultMode}`}>{resultMode === 'production' ? '真实数据' : resultMode === 'staging' ? '内测数据' : '本地演示'}</span><span className="saved-summary"><Heart size={15} fill="currentColor" /> {favoriteIds.length} 已收藏</span><button className="avatar-button" aria-label="菜单" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}><Menu size={19} /></button></div>{mobileMenuOpen && <nav className="mobile-nav"><a href="#explore" onClick={() => setMobileMenuOpen(false)}>工作找房</a><a href="#how" onClick={() => setMobileMenuOpen(false)}>推荐逻辑</a><a href="#about" onClick={() => setMobileMenuOpen(false)}>产品说明</a><button onClick={() => { setMobileMenuOpen(false); setApiSetupOpen(true) }}><KeyRound size={14} /> API 配置</button></nav>}</header>
    <main className="main-layout" id="explore">
      <aside className={`control-panel ${mobileFiltersOpen ? 'mobile-open' : ''}`}><div className="mobile-filter-header"><span>找房条件</span><button className="icon-button" onClick={() => setMobileFiltersOpen(false)}><X size={18} /></button></div>
        <div className="intro-copy"><p className="eyebrow"><Sparkles size={14} /> 职住决策助手</p><h1>从公司出发，找到更适合住的房子。</h1><p className="intro-text">不是只找最快，而是在预算、空间、时间和换乘之间找到长期舒服的选择。</p></div>
        <form className="office-search" onSubmit={handleOfficeSearch}><MapPin size={18} /><input value={searchText} onChange={(event) => setSearchText(event.target.value)} aria-label="工作地点" placeholder="输入任意上海工作地点" /><button type="submit" aria-label="定位工作地点"><Search size={18} /></button></form>{dataMode === 'staging' && <div className="staging-office-list">{stagingOffices.map((item) => <button key={item.id} className={office.id === item.id ? 'active' : ''} onClick={() => chooseStagingOffice(item)}>{item.name.replace('上海', '')}</button>)}</div>}<p className="search-hint"><Navigation size={13} /> {office.subtitle}{dataMode === 'staging' && !office.testRegion ? ' · 真实高德路线' : ''}</p>
        <div className="panel-divider" /><div className="section-heading"><div><p className="eyebrow">HARD FILTERS</p><h2>不可放宽的条件</h2></div><button className="reset-button" onClick={() => setPreferences(defaultPreferences)}><RotateCcw size={14} /> 重置</button></div>
        <div className="filter-grid"><label>租赁方式<select value={preferences.rentalType} onChange={(event) => updatePreference('rentalType', event.target.value as SearchPreferences['rentalType'])}><option>全部</option><option>整租</option><option>合租</option></select></label><label>户型<select value={preferences.bedroomCount} onChange={(event) => updatePreference('bedroomCount', Number(event.target.value))}><option value="0">不限</option><option value="1">1 室</option><option value="2">2 室</option><option value="3">3 室及以上</option></select></label><label>最小面积<select value={preferences.minArea} onChange={(event) => updatePreference('minArea', Number(event.target.value))}><option value="0">不限</option><option value="20">20㎡</option><option value="30">30㎡</option><option value="40">40㎡</option><option value="50">50㎡</option></select></label><label>地铁步行<select value={preferences.maxStationWalkMinutes} onChange={(event) => updatePreference('maxStationWalkMinutes', Number(event.target.value))}><option value="0">不限</option><option value="5">5 分钟内</option><option value="10">10 分钟内</option><option value="15">15 分钟内</option><option value="20">20 分钟内</option></select></label></div>
        <div className="field-label budget-label"><span>月租预算</span><strong>¥{preferences.budget.toLocaleString()} 以内</strong></div><div className="budget-control"><button onClick={() => updatePreference('budget', Math.max(2000, preferences.budget - 500))}>−</button><div><WalletCards size={16} /> ¥{preferences.budget.toLocaleString()}</div><button onClick={() => updatePreference('budget', Math.min(20000, preferences.budget + 500))}>＋</button></div>
        <div className="segmented-control"><button className={preferences.commuteMode === 'limit' ? 'active' : ''} onClick={() => updatePreference('commuteMode', 'limit')}><Clock3 size={15} /> 最长用时</button><button className={preferences.commuteMode === 'arrival' ? 'active' : ''} onClick={() => updatePreference('commuteMode', 'arrival')}><Check size={15} /> 到达时间</button></div>
        {preferences.commuteMode === 'limit' ? <div className="range-field"><div className="field-label"><span>最多接受通勤</span><strong>{preferences.commuteLimit} 分钟</strong></div><input type="range" min="15" max="90" step="5" value={preferences.commuteLimit} onChange={(event) => updatePreference('commuteLimit', Number(event.target.value))} /></div> : <div className="arrival-field"><div className="field-label"><span>希望工作日到达</span><strong>{preferences.arrivalTime}</strong></div><input type="time" value={preferences.arrivalTime} onChange={(event) => updatePreference('arrivalTime', event.target.value)} /></div>}
        <div className="field-label transport-label"><span>通勤方式</span><span className="muted">切换后自动重算</span></div><div className="transport-grid">{transportOptions.map((option) => { const Icon = transportIcons[option.value]; return <button key={option.value} className={preferences.transport === option.value ? 'active' : ''} onClick={() => changeTransport(option.value as Transport)}><Icon size={16} />{option.label}</button> })}</div>
        {preferences.transport === '公共交通' && <div className="strategy-grid">{routeStrategies.map((strategy) => <button key={strategy.value} className={preferences.routeStrategy === strategy.value ? 'active' : ''} onClick={() => { const next = { ...preferences, routeStrategy: strategy.value }; setPreferences(next); void runSearch(office, next) }}>{strategy.label}</button>)}</div>}
        <div className="preference-card"><div className="preference-title"><div><p className="eyebrow">ROUTE FEEL</p><h3>时间还是少换乘？</h3></div><span>{preferences.timeComfort > 60 ? '时间优先' : preferences.timeComfort < 40 ? '舒适优先' : '平衡'}</span></div><div className="preference-slider-labels"><span>少换乘更舒服</span><span>更快到公司</span></div><input type="range" min="0" max="100" value={preferences.timeComfort} onChange={(event) => updatePreference('timeComfort', Number(event.target.value))} /><p className="preference-help">相差 10 分钟以内时，少换乘路线会得到更直观的推荐解释。</p></div>
        <button className="search-cta" onClick={() => runSearch()} disabled={status === 'loading'}>{status === 'loading' ? '正在计算路线…' : '查看匹配房源'}</button><p className="hard-filter-note"><ShieldIcon /> 预算、面积等硬条件不会自动放宽</p>
      </aside>
      <section className="explore-panel"><div className="results-toolbar"><div><p className="eyebrow">COMMUTE DECISION</p><h2>{status === 'loading' ? '正在计算推荐…' : `严格匹配 ${groupCounts.real + groupCounts.synthetic} 套`}</h2><p className="results-subtitle">围绕「{office.name}」 · {preferences.transport} · {preferences.commuteMode === 'limit' ? `${preferences.commuteLimit} 分钟内` : `${preferences.arrivalTime} 前到达`}</p></div><div className="toolbar-actions"><button className="filter-toggle" onClick={() => setMobileFiltersOpen(true)}><SlidersHorizontal size={16} /> 筛选条件</button><button className="sort-button"><ArrowDownUp size={15} /> 组内综合得分</button></div></div>
        {error && <div className="state-card error-state"><strong>没有完成这次搜索</strong><p>{error}</p><button onClick={() => runSearch()}>重新尝试</button></div>}
        {!error && status !== 'loading' && results.length === 0 && <div className="state-card empty-state"><Sparkles size={26} /><strong>没有完全符合条件的房源</strong><p>我们没有擅自放宽预算或面积。请调整左侧条件后重新搜索。</p><button onClick={() => setMobileFiltersOpen(true)}>修改筛选</button></div>}
        {!error && results.length > 0 && <div className="explore-grid"><div className="map-panel"><MapView office={office} listings={resultListings} selectedId={selectedId} onSelect={setSelectedId} /><div className="map-overlay map-legend"><span className="legend-dot office-dot" /> 工作地点 <span className="legend-dot home-dot" /> 推荐房源</div></div><div className="listing-panel"><div className="listing-panel-header"><span>按数据类型分组</span><span className="muted">真实与模拟不混排</span></div><div className="listing-scroll">{(['real', 'synthetic', 'fallback'] as const).map((origin) => groupedResults[origin].length > 0 && <section className={`result-group ${origin}`} key={origin}><header><strong>{origin === 'real' ? '真实严格匹配' : origin === 'synthetic' ? '内测模拟 · 严格匹配' : '极端条件测试兜底'}</strong><span>{groupedResults[origin].length} 套</span></header>{origin === 'fallback' && <p className="group-warning">以下样本不满足全部条件，仅用于验证页面边界，不进入数据库和正式推荐。</p>}{groupedResults[origin].map((item) => <ListingCard key={item.listing.id} item={item} isSelected={selectedId === item.listing.id} isFavorite={favoriteIds.includes(item.listing.id)} isComparing={compareIds.includes(item.listing.id)} onSelect={() => setSelectedId(item.listing.id)} onFavorite={() => setFavoriteIds((current) => current.includes(item.listing.id) ? current.filter((id) => id !== item.listing.id) : [...current, item.listing.id])} onCompare={() => toggleCompare(item.listing.id)} />)}</section>)}</div></div></div>}
        {results.length > 0 && <div className="feedback-bar">{feedbackSent ? <span><Check size={16} /> 已收到反馈</span> : <><span>前三条推荐对你有帮助吗？</span><button onClick={() => sendFeedback(true)}><ThumbsUp size={15} /> 有帮助</button><button onClick={() => sendFeedback(false)}><ThumbsDown size={15} /> 需改进</button></>}</div>}
      </section>
    </main>
    <ProductSections onApiSetup={() => setApiSetupOpen(true)} />
    {selectedItem && <section className="detail-strip"><div className="detail-image"><img src={selectedItem.listing.image} alt="" /></div><div className="detail-main"><span className="detail-kicker"><Sparkles size={13} /> 为什么推荐</span><h2>{selectedItem.listing.title}</h2><p>{selectedItem.reasons.join('；')}</p></div><div className="detail-stat"><span>预计通勤</span><strong>{selectedItem.commute.time} 分钟</strong><small>{selectedItem.commute.transfers} 次换乘 · 步行 {selectedItem.commute.walk} 分钟</small></div><div className="detail-stat"><span>综合得分</span><strong>{selectedItem.score} 分</strong><small>规则透明可解释</small></div><button className="detail-close" onClick={() => setSelectedId('')} aria-label="关闭详情"><X size={18} /></button></section>}
    {compareItems.length > 0 && <div className="compare-dock"><div className="compare-title"><ArrowDownUp size={16} /><strong>房源对比</strong><span>{compareItems.length}/3</span></div><div className="compare-items">{compareItems.map((item) => <button key={item.listing.id} onClick={() => setSelectedId(item.listing.id)}><img src={item.listing.image} alt="" /><span>{item.listing.title}</span><X size={14} onClick={(event) => { event.stopPropagation(); toggleCompare(item.listing.id) }} /></button>)}</div><button className="compare-cta" onClick={() => setCompareOpen(true)}>开始对比</button></div>}
    {compareOpen && <ComparePanel items={compareItems} onClose={() => setCompareOpen(false)} onRemove={toggleCompare} />}{apiSetupOpen && <ApiSetupPanel onClose={() => setApiSetupOpen(false)} />}{toast && <div className="toast"><Check size={15} /> {toast}</div>}
  </div>
}

function ShieldIcon() { return <span aria-hidden="true">✓</span> }
export default App
