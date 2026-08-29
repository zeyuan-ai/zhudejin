import { ArrowUpRight, Bike, CarFront, Footprints, Heart, MapPin, Repeat2, ShieldCheck, TrainFront } from 'lucide-react'
import type { RankedListing } from '../types'

interface ListingCardProps {
  item: RankedListing; isSelected: boolean; isFavorite: boolean; isComparing: boolean
  onSelect: () => void; onFavorite: () => void; onCompare: () => void
}

export function ListingCard({ item, isSelected, isFavorite, isComparing, onSelect, onFavorite, onCompare }: ListingCardProps) {
  const { listing, commute } = item
  const stale = listing.dataOrigin === 'real' && Date.now() - new Date(listing.updatedAt).getTime() > 7 * 86400000
  const TransportIcon = commute.mode === '驾车' ? CarFront : commute.mode === '骑行' ? Bike : commute.mode === '步行' ? Footprints : TrainFront
  const originLabel = listing.dataOrigin === 'real' ? '真实房源' : listing.dataOrigin === 'fallback' ? '边界测试样本' : '内测模拟数据'
  return (
    <article className={`listing-card ${isSelected ? 'is-selected' : ''}`} onClick={onSelect}>
      <div className="listing-image-wrap">
        <img src={listing.image} alt={listing.title} className="listing-image" />
        <span className="match-pill">{item.score} 分</span><span className={`origin-pill ${listing.dataOrigin}`}>{originLabel}</span>
        <button className={`icon-button image-action ${isFavorite ? 'is-favorite' : ''}`} onClick={(event) => { event.stopPropagation(); onFavorite() }} aria-label={isFavorite ? '取消收藏' : '收藏房源'}><Heart size={17} fill={isFavorite ? 'currentColor' : 'none'} /></button>
      </div>
      <div className="listing-content">
        <div className="listing-headline"><div><p className="listing-kicker">{listing.district} · {listing.rentalType}</p><h3>{listing.title}</h3></div><p className="rent"><strong>¥{listing.rent.toLocaleString()}</strong><span>/月</span></p></div>
        <div className="listing-meta"><span>{listing.bedrooms}</span><span>·</span><span>{listing.area}㎡</span><span>·</span><span>{listing.buildYear} 年</span></div>
        <div className="commute-line"><span className="transport-badge"><TransportIcon size={14} /> {commute.mode}</span><strong>{commute.time} 分钟</strong><span className="muted">· {commute.summary}</span></div>
        <p className="recommend-reason">{item.reasons[0]}</p>
        {item.fallbackDifferences?.length ? <ul className="fallback-differences">{item.fallbackDifferences.map((difference) => <li key={difference}>{difference}</li>)}</ul> : null}
        <div className="listing-footline"><span><Repeat2 size={14} /> {commute.transfers === 0 ? '无需换乘' : `${commute.transfers} 次换乘`}</span><span><MapPin size={14} /> 地铁步行 {listing.stationWalkMinutes} 分钟</span><span><ShieldCheck size={14} /> {item.label}</span></div>
        <div className="score-mini"><span>预算 {item.breakdown.budget}/25</span><span>居住 {Math.round(item.breakdown.area + item.breakdown.station)}/15</span><span>通勤 {Math.round(item.breakdown.time + item.breakdown.transfers + item.breakdown.walk + item.breakdown.cost)}/60</span></div>
        <div className="card-actions">
          <span className={`source-meta ${stale ? 'is-stale' : ''}`}>{listing.dataOrigin === 'real' ? `${listing.sourceName} · ${listing.updatedAt}${stale ? ' · 请核验' : ''}` : '固定模拟样本 · 不代表真实出租状态'}</span>
          <div className="card-action-buttons"><button className={`compare-button ${isComparing ? 'is-comparing' : ''}`} onClick={(event) => { event.stopPropagation(); onCompare() }}>{isComparing ? '已对比' : '加入对比'}</button>{listing.dataOrigin === 'real' && listing.sourceUrl && <a href={listing.sourceUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>查看来源 <ArrowUpRight size={13} /></a>}</div>
        </div>
      </div>
    </article>
  )
}
