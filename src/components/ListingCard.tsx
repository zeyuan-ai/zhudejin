import { ArrowRight, Heart, MapPin, Repeat2, ShieldCheck, TrainFront } from 'lucide-react'
import type { RankedListing } from '../types'

interface ListingCardProps {
  item: RankedListing
  isSelected: boolean
  isFavorite: boolean
  isComparing: boolean
  onSelect: () => void
  onFavorite: () => void
  onCompare: () => void
}

export function ListingCard({ item, isSelected, isFavorite, isComparing, onSelect, onFavorite, onCompare }: ListingCardProps) {
  const { listing, commute } = item

  return (
    <article className={`listing-card ${isSelected ? 'is-selected' : ''}`} onClick={onSelect}>
      <div className="listing-image-wrap">
        <img src={listing.image} alt={listing.title} className="listing-image" />
        <span className="match-pill">{item.score}% 匹配</span>
        <button
          className={`icon-button image-action ${isFavorite ? 'is-favorite' : ''}`}
          onClick={(event) => {
            event.stopPropagation()
            onFavorite()
          }}
          aria-label={isFavorite ? '取消收藏' : '收藏房源'}
        >
          <Heart size={17} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="listing-content">
        <div className="listing-headline">
          <div>
            <p className="listing-kicker">{listing.district}</p>
            <h3>{listing.title}</h3>
          </div>
          <p className="rent"><strong>¥{listing.rent.toLocaleString()}</strong><span>/月</span></p>
        </div>
        <div className="listing-meta">
          <span>{listing.bedrooms}</span><span>·</span><span>{listing.area}㎡</span><span>·</span><span>{listing.buildYear} 年</span>
        </div>
        <div className="commute-line">
          <span className="transport-badge"><TrainFront size={14} /> {commute.mode}</span>
          <strong>{commute.time} 分钟</strong>
          <span className="muted">· {commute.summary}</span>
        </div>
        <div className="listing-footline">
          <span><Repeat2 size={14} /> {commute.transfers === 0 ? '无需换乘' : `${commute.transfers} 次换乘`}</span>
          <span><MapPin size={14} /> {listing.stationDistance}</span>
          <span><ShieldCheck size={14} /> {item.label}</span>
        </div>
        <div className="card-actions">
          <div className="tag-row">{listing.tags.slice(0, 2).map((tag) => <span className="soft-tag" key={tag}>{tag}</span>)}</div>
          <button className={`compare-button ${isComparing ? 'is-comparing' : ''}`} onClick={(event) => { event.stopPropagation(); onCompare() }}>
            {isComparing ? '已加入对比' : '加入对比'} <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </article>
  )
}
