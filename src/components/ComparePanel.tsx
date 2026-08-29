import { X } from 'lucide-react'
import type { RankedListing } from '../types'

export function ComparePanel({ items, onClose, onRemove }: { items: RankedListing[]; onClose: () => void; onRemove: (id: string) => void }) {
  return <div className="compare-backdrop" role="dialog" aria-modal="true" aria-label="房源对比">
    <section className="compare-panel"><header><div><p className="eyebrow">SIDE BY SIDE</p><h2>房源对比</h2></div><button className="icon-button" onClick={onClose} aria-label="关闭对比"><X /></button></header>
      <div className="compare-table"><div className="compare-labels"><strong>项目</strong><span>月租</span><span>面积</span><span>地铁步行</span><span>通勤</span><span>换乘</span><span>路线步行</span><span>费用</span><span>综合分</span></div>{items.map((item) => <div className="compare-column" key={item.listing.id}><strong>{item.listing.title}</strong><span>¥{item.listing.rent}</span><span>{item.listing.area}㎡</span><span>{item.listing.stationWalkMinutes} 分钟</span><span>{item.commute.time} 分钟</span><span>{item.commute.transfers} 次</span><span>{item.commute.walk} 分钟</span><span>¥{item.commute.cost}</span><span>{item.score} 分</span><button onClick={() => onRemove(item.listing.id)}>移出对比</button></div>)}</div>
    </section>
  </div>
}
