import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownUp,
  Bike,
  Bus,
  CarFront,
  Check,
  ChevronDown,
  Clock3,
  Footprints,
  Heart,
  Home,
  MapPin,
  Menu,
  Navigation,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrainFront,
  WalletCards,
  X,
} from 'lucide-react'
import { demoListings, demoOffice, transportOptions } from './data'
import { rankListings } from './lib/recommend'
import type { SearchPreferences, Transport } from './types'
import { ListingCard } from './components/ListingCard'
import { MapView } from './components/MapView'

const transportIcons = {
  地铁: TrainFront,
  公交: Bus,
  驾车: CarFront,
  骑行: Bike,
  步行: Footprints,
} as const

const defaultPreferences: SearchPreferences = {
  budget: 5000,
  commuteLimit: 35,
  arrivalTime: '09:00',
  commuteMode: 'limit',
  transport: '地铁',
  timeComfort: 55,
}

function App() {
  const [preferences, setPreferences] = useState<SearchPreferences>(defaultPreferences)
  const [searchText, setSearchText] = useState(demoOffice.name)
  const [submittedOffice, setSubmittedOffice] = useState(demoOffice.name)
  const [selectedId, setSelectedId] = useState(demoListings[0].id)
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('zhudejin-favorites') ?? '[]') as string[]
    } catch {
      return []
    }
  })
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [toast, setToast] = useState('')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const rankedListings = useMemo(() => rankListings(demoListings, preferences), [preferences])
  const filteredListings = useMemo(() => {
    const matches = rankedListings.filter((item) => item.isWithinBudget && item.isWithinTime)
    return matches.length > 0 ? matches : rankedListings.slice(0, 3)
  }, [rankedListings])
  const selectedItem = rankedListings.find((item) => item.listing.id === selectedId) ?? rankedListings[0]
  const compareListings = demoListings.filter((listing) => compareIds.includes(listing.id))
  const isRelaxedResult = !rankedListings.some((item) => item.isWithinBudget && item.isWithinTime)

  useEffect(() => {
    localStorage.setItem('zhudejin-favorites', JSON.stringify(favoriteIds))
  }, [favoriteIds])

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2400)
  }

  const updatePreference = <K extends keyof SearchPreferences>(key: K, value: SearchPreferences[K]) => {
    setPreferences((current) => ({ ...current, [key]: value }))
  }

  const toggleFavorite = (id: string) => {
    setFavoriteIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  const toggleCompare = (id: string) => {
    setCompareIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id)
      if (current.length >= 3) {
        showToast('最多对比 3 套房源')
        return current
      }
      return [...current, id]
    })
  }

  const resetPreferences = () => {
    setPreferences(defaultPreferences)
    showToast('已恢复推荐设置')
  }

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextOffice = searchText.trim() || demoOffice.name
    setSubmittedOffice(nextOffice)
    showToast('已按工作地点更新推荐')
  }

  const handleArrivalMode = (mode: SearchPreferences['commuteMode']) => {
    updatePreference('commuteMode', mode)
    if (mode === 'arrival') showToast('已切换为到达时间模式，路线将按工作日早高峰估算')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark"><Home size={18} strokeWidth={2.4} /></div>
          <div><strong>住得近</strong><span>WORK TO HOME</span></div>
        </div>
        <nav className="top-nav"><a className="active" href="#explore">工作找房</a><a href="#how-it-works">怎么推荐</a><a href="#about">关于产品</a></nav>
        <div className="top-actions"><span className="saved-summary"><Heart size={15} fill="currentColor" /> {favoriteIds.length} 已收藏</span><button className="avatar-button" aria-label="打开个人菜单"><Menu size={19} /></button></div>
      </header>

      <main className="main-layout" id="explore">
        <aside className={`control-panel ${mobileFiltersOpen ? 'mobile-open' : ''}`}>
          <div className="mobile-filter-header"><span>找房条件</span><button className="icon-button" onClick={() => setMobileFiltersOpen(false)}><X size={18} /></button></div>
          <div className="intro-copy">
            <p className="eyebrow"><Sparkles size={14} /> 职住决策助手</p>
            <h1>把每天的通勤，变成可选择的生活。</h1>
            <p className="intro-text">从工作地点出发，综合租金、路线和换乘，找到更适合长期住下来的地方。</p>
          </div>

          <form className="office-search" onSubmit={handleSearch}>
            <MapPin size={18} />
            <input value={searchText} onChange={(event) => setSearchText(event.target.value)} aria-label="工作地点" />
            <button type="submit" aria-label="搜索工作地点"><Search size={18} /></button>
          </form>
          <p className="search-hint"><Navigation size={13} /> 当前演示数据：{submittedOffice}</p>

          <div className="panel-divider" />
          <div className="section-heading"><div><p className="eyebrow">YOUR COMMUTE</p><h2>你的通勤偏好</h2></div><button className="reset-button" onClick={resetPreferences}><RotateCcw size={14} /> 重置</button></div>

          <div className="segmented-control">
            <button className={preferences.commuteMode === 'limit' ? 'active' : ''} onClick={() => handleArrivalMode('limit')}><Clock3 size={15} /> 最长用时</button>
            <button className={preferences.commuteMode === 'arrival' ? 'active' : ''} onClick={() => handleArrivalMode('arrival')}><Check size={15} /> 到达时间</button>
          </div>

          {preferences.commuteMode === 'limit' ? (
            <div className="range-field"><div className="field-label"><span>最多接受通勤</span><strong>{preferences.commuteLimit} 分钟</strong></div><input type="range" min="15" max="60" step="5" value={preferences.commuteLimit} onChange={(event) => updatePreference('commuteLimit', Number(event.target.value))} /></div>
          ) : (
            <div className="arrival-field"><div className="field-label"><span>希望到达公司</span><strong>工作日早高峰</strong></div><input type="time" value={preferences.arrivalTime} onChange={(event) => updatePreference('arrivalTime', event.target.value)} /></div>
          )}

          <div className="field-label budget-label"><span>月租预算</span><strong>¥{preferences.budget.toLocaleString()} 以内</strong></div>
          <div className="budget-control"><button onClick={() => updatePreference('budget', Math.max(2500, preferences.budget - 500))}>−</button><div><WalletCards size={16} /> <span>¥{preferences.budget.toLocaleString()}</span></div><button onClick={() => updatePreference('budget', Math.min(8000, preferences.budget + 500))}>＋</button></div>

          <div className="field-label transport-label"><span>主要通勤方式</span><span className="muted">可随时切换</span></div>
          <div className="transport-grid">
            {transportOptions.map((option) => {
              const Icon = transportIcons[option.value]
              return <button key={option.value} className={preferences.transport === option.value ? 'active' : ''} onClick={() => updatePreference('transport', option.value as Transport)}><Icon size={16} />{option.label}</button>
            })}
          </div>

          <div className="preference-card">
            <div className="preference-title"><div><p className="eyebrow">ROUTE FEEL</p><h3>你更在意什么？</h3></div><span>{preferences.timeComfort > 60 ? '时间优先' : preferences.timeComfort < 40 ? '舒适优先' : '平衡'}</span></div>
            <div className="preference-slider-labels"><span>少换乘更舒服</span><span>更快到公司</span></div>
            <input type="range" min="0" max="100" value={preferences.timeComfort} onChange={(event) => updatePreference('timeComfort', Number(event.target.value))} />
            <p className="preference-help">路线只差 10 分钟时，我们会根据你的偏好决定是否推荐少一次换乘的方案。</p>
          </div>

          <div className="insight-card"><div className="insight-icon"><Sparkles size={18} /></div><div><strong>今天的提醒</strong><p>少一次换乘，往往比少 10 分钟更容易坚持。</p></div></div>
        </aside>

        <section className="explore-panel">
          <div className="results-toolbar">
            <div><p className="eyebrow">LIVE RECOMMENDATION</p><h2>适合你的 {filteredListings.length} 处住处</h2><p className="results-subtitle">围绕「{submittedOffice}」 · {preferences.commuteMode === 'limit' ? `${preferences.commuteLimit} 分钟通勤圈` : `${preferences.arrivalTime} 前到达`}</p></div>
            <div className="toolbar-actions"><button className="filter-toggle" onClick={() => setMobileFiltersOpen(true)}><SlidersHorizontal size={16} /> 筛选条件</button><button className="sort-button"><ArrowDownUp size={15} /> 匹配度最高 <ChevronDown size={14} /></button></div>
          </div>

          <div className="explore-grid">
            <div className="map-panel"><MapView office={demoOffice} listings={filteredListings.map((item) => item.listing)} selectedId={selectedId} onSelect={setSelectedId} /><div className="map-overlay map-legend"><span className="legend-dot office-dot" /> 工作地点 <span className="legend-dot home-dot" /> 推荐房源</div><div className="map-overlay map-note"><Navigation size={13} /> 5 km 通勤参考圈</div></div>
            <div className="listing-panel">
              <div className="listing-panel-header"><span>{isRelaxedResult ? '放宽条件后的推荐' : '符合条件的房源'}</span><span className="muted">{filteredListings.length} 套</span></div>
              {isRelaxedResult && <div className="relaxed-notice"><Sparkles size={15} /><span>暂时没有完全符合的房源，已为你放宽 15 分钟或 ¥1,000 展示相近选择。</span></div>}
              <div className="listing-scroll">
                {filteredListings.map((item) => <ListingCard key={item.listing.id} item={item} isSelected={selectedId === item.listing.id} isFavorite={favoriteIds.includes(item.listing.id)} isComparing={compareIds.includes(item.listing.id)} onSelect={() => setSelectedId(item.listing.id)} onFavorite={() => toggleFavorite(item.listing.id)} onCompare={() => toggleCompare(item.listing.id)} />)}
              </div>
            </div>
          </div>
        </section>
      </main>

      {selectedItem && <section className="detail-strip"><div className="detail-image"><img src={selectedItem.listing.image} alt="" /></div><div className="detail-main"><span className="detail-kicker"><Sparkles size={13} /> 当前选中</span><h2>{selectedItem.listing.title}</h2><p>{selectedItem.listing.description}</p></div><div className="detail-stat"><span>预计通勤</span><strong>{selectedItem.commute.time} 分钟</strong><small>{selectedItem.commute.summary}</small></div><div className="detail-stat"><span>月租</span><strong>¥{selectedItem.listing.rent.toLocaleString()}</strong><small>{selectedItem.listing.bedrooms} · {selectedItem.listing.area}㎡</small></div><button className="detail-close" onClick={() => setSelectedId('')} aria-label="关闭详情"><X size={18} /></button></section>}

      {compareListings.length > 0 && <div className="compare-dock"><div className="compare-title"><ArrowDownUp size={16} /><strong>房源对比</strong><span>{compareListings.length}/3</span></div><div className="compare-items">{compareListings.map((listing) => <button key={listing.id} onClick={() => setSelectedId(listing.id)}><img src={listing.image} alt="" /><span>{listing.title}</span><X size={14} onClick={(event) => { event.stopPropagation(); toggleCompare(listing.id) }} /></button>)}</div><button className="compare-cta" onClick={() => showToast('对比面板将在下一版支持路线并排查看')}>开始对比 <ArrowDownUp size={15} /></button></div>}
      {toast && <div className="toast"><Check size={15} /> {toast}</div>}
    </div>
  )
}

export default App
