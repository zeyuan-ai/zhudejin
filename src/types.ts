export type Transport = '地铁' | '公交' | '驾车' | '骑行' | '步行'

export type Coordinates = [number, number]

export interface WorkLocation {
  id: string
  name: string
  subtitle: string
  coords: Coordinates
}

export interface CommuteOption {
  mode: Transport
  time: number
  transfers: number
  walk: number
  cost: number
  reliability: number
  summary: string
}

export interface HousingListing {
  id: string
  title: string
  district: string
  address: string
  coords: Coordinates
  rent: number
  bedrooms: string
  area: number
  image: string
  station: string
  stationDistance: string
  buildYear: number
  highlights: string[]
  tags: string[]
  description: string
  commute: Record<Transport, CommuteOption>
}

export interface SearchPreferences {
  budget: number
  commuteLimit: number
  arrivalTime: string
  commuteMode: 'limit' | 'arrival'
  transport: Transport
  timeComfort: number
}

export interface RankedListing {
  listing: HousingListing
  commute: CommuteOption
  score: number
  isWithinBudget: boolean
  isWithinTime: boolean
  label: string
}
