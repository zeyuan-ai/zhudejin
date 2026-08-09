import { useEffect } from 'react'
import L from 'leaflet'
import { Circle, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import type { HousingListing, WorkLocation } from '../types'

interface MapViewProps {
  office: WorkLocation
  listings: HousingListing[]
  selectedId: string
  onSelect: (id: string) => void
}

const makePriceIcon = (price: number, active: boolean) =>
  L.divIcon({
    className: 'price-marker-wrap',
    html: `<span class="price-marker ${active ? 'is-active' : ''}"><b>¥${price}</b></span>`,
    iconSize: [74, 34],
    iconAnchor: [37, 30],
    popupAnchor: [0, -31],
  })

const officeIcon = L.divIcon({
  className: 'office-marker-wrap',
  html: '<span class="office-marker"><span></span></span>',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
})

function MapFocus({ office }: { office: WorkLocation }) {
  const map = useMap()

  useEffect(() => {
    map.flyTo(office.coords, 12.5, { duration: 0.7 })
  }, [map, office.coords])

  return null
}

export function MapView({ office, listings, selectedId, onSelect }: MapViewProps) {
  const selected = listings.find((listing) => listing.id === selectedId)

  return (
    <MapContainer center={office.coords} zoom={12.5} scrollWheelZoom={false} zoomControl={false} className="map-canvas">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapFocus office={office} />
      <Circle center={office.coords} radius={5000} pathOptions={{ color: '#b8a27c', fillColor: '#efe7d8', fillOpacity: 0.14, weight: 1.2, dashArray: '5 8' }} />
      <Marker position={office.coords} icon={officeIcon}>
        <Popup>
          <strong>{office.name}</strong>
          <br />你的工作地点
        </Popup>
      </Marker>
      {selected && <Polyline positions={[office.coords, selected.coords]} pathOptions={{ color: '#d87853', weight: 3, dashArray: '7 8', opacity: 0.8 }} />}
      {listings.map((listing) => (
        <Marker
          key={listing.id}
          position={listing.coords}
          icon={makePriceIcon(listing.rent, selectedId === listing.id)}
          eventHandlers={{ click: () => onSelect(listing.id) }}
        >
          <Popup>
            <strong>{listing.title}</strong>
            <br />¥{listing.rent.toLocaleString()} / 月
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
