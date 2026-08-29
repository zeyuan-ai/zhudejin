import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { Circle, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import type { HousingListing, WorkLocation } from '../types'
import { hasAmapConfig, loadAmap } from '../services/amap'

interface MapViewProps { office: WorkLocation; listings: HousingListing[]; selectedId: string; onSelect: (id: string) => void }
const toLngLat = ([lat, lng]: [number, number]) => [lng, lat]
const makePriceIcon = (rent: number, active: boolean) => L.divIcon({ className: 'price-marker-wrap', html: `<span class="price-marker ${active ? 'is-active' : ''}"><b>¥${rent}</b></span>`, iconSize: [74, 34], iconAnchor: [37, 30] })
const officeIcon = L.divIcon({ className: 'office-marker-wrap', html: '<span class="office-marker"><span></span></span>', iconSize: [38, 38], iconAnchor: [19, 19] })

function OSMFocus({ office, listings }: { office: WorkLocation; listings: HousingListing[] }) {
  const map = useMap()
  useEffect(() => {
    const points = [office.coords, ...listings.map((listing) => listing.coords)]
    if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [45, 45], maxZoom: 13 })
    else map.setView(office.coords, 13)
  }, [map, office, listings])
  return null
}

function OpenStreetMapFallback({ office, listings, selectedId, onSelect, reason }: MapViewProps & { reason?: string }) {
  const selected = listings.find((listing) => listing.id === selectedId)
  return <div className="osm-map-wrap">
    <MapContainer center={office.coords} zoom={12.5} scrollWheelZoom className="map-canvas">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <OSMFocus office={office} listings={listings} />
      <Circle center={office.coords} radius={5000} pathOptions={{ color: '#d87853', fillColor: '#efe7d8', fillOpacity: .12, weight: 1.2, dashArray: '5 8' }} />
      <Marker position={office.coords} icon={officeIcon}><Popup><strong>{office.name}</strong><br />工作地点</Popup></Marker>
      {selected && <Polyline positions={[selected.coords, office.coords]} pathOptions={{ color: '#d87853', weight: 3, dashArray: '7 8' }} />}
      {listings.map((listing) => <Marker key={listing.id} position={listing.coords} icon={makePriceIcon(listing.rent, selectedId === listing.id)} eventHandlers={{ click: () => onSelect(listing.id) }}><Popup><strong>{listing.title}</strong><br />¥{listing.rent.toLocaleString()} / 月</Popup></Marker>)}
    </MapContainer>
    <span className="demo-map-badge">{reason || 'OpenStreetMap 演示底图 · 当前显示真实虹桥区域'}</span>
  </div>
}

export function MapView(props: MapViewProps) {
  const { office, listings, selectedId, onSelect } = props
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [mapError, setMapError] = useState('')
  const configured = hasAmapConfig()

  useEffect(() => {
    if (!configured || !containerRef.current) return
    let cancelled = false; let overlays: any[] = []
    loadAmap().then((AMap) => {
      if (cancelled || !containerRef.current) return
      mapRef.current?.destroy?.()
      const map = new AMap.Map(containerRef.current, { zoom: 12, center: toLngLat(office.coords), mapStyle: 'amap://styles/whitesmoke' }); mapRef.current = map
      map.addControl(new AMap.Scale()); map.addControl(new AMap.ToolBar({ position: { right: '12px', top: '60px' } }))
      const officeMarker = new AMap.Marker({ position: toLngLat(office.coords), content: '<div class="amap-office-marker">公司</div>', offset: new AMap.Pixel(-20, -20) })
      const circle = new AMap.Circle({ center: toLngLat(office.coords), radius: 5000, strokeColor: '#d87853', strokeOpacity: .45, fillColor: '#efe7d8', fillOpacity: .18 })
      const markers = listings.map((listing) => { const marker = new AMap.Marker({ position: toLngLat(listing.coords), content: `<button class="amap-price-marker ${listing.id === selectedId ? 'is-active' : ''}">¥${listing.rent}</button>`, offset: new AMap.Pixel(-35, -28) }); marker.on('click', () => onSelect(listing.id)); return marker })
      overlays = [officeMarker, circle, ...markers]
      const selected = listings.find((listing) => listing.id === selectedId)
      if (selected) overlays.push(new AMap.Polyline({ path: [toLngLat(selected.coords), toLngLat(office.coords)], strokeColor: '#d87853', strokeWeight: 3, strokeStyle: 'dashed' }))
      map.add(overlays); if (listings.length) map.setFitView(overlays, false, [50, 50, 50, 50], 13)
    }).catch(() => setMapError('高德地图加载失败，已切换到 OpenStreetMap'))
    return () => { cancelled = true; if (mapRef.current && overlays.length) mapRef.current.remove(overlays); mapRef.current?.destroy?.(); mapRef.current = null }
  }, [configured, office, listings, selectedId, onSelect])

  if (!configured || mapError) return <OpenStreetMapFallback {...props} reason={mapError} />
  return <div ref={containerRef} className="map-canvas" aria-label="高德地图房源分布" />
}
