export type Transport = '公共交通' | '驾车' | '骑行' | '步行'
export type RouteStrategy = 'fastest' | 'least-transfer' | 'least-walk' | 'metro-first' | 'avoid-metro'
export type RentalType = '整租' | '合租'
export type ListingStatus = 'active' | 'inactive' | 'expired'
export type Coordinates = [number, number]
export type DataOrigin = 'real' | 'synthetic' | 'fallback'
export type DataMode = 'staging' | 'production' | 'demo'
export type TestRegion = 'hongqiao' | 'lujiazui' | 'peoples-square' | 'xujiahui' | 'zhangjiang'

export interface WorkLocation { id: string; name: string; subtitle: string; coords: Coordinates; testRegion?: TestRegion }

export interface CommuteOption {
  id: string; mode: Transport; strategy: RouteStrategy; time: number; transfers: number
  walk: number; cost: number; reliability: number; summary: string; period?: 'morning-peak' | 'off-peak' | 'evening-peak'; synthetic?: boolean
}

export interface HousingListing {
  id: string; title: string; district: string; address: string; coords: Coordinates; rent: number
  rentalType: RentalType; bedroomCount: number; bedrooms: string; area: number; image: string
  station: string; stationWalkMinutes: number; buildYear: number; highlights: string[]; tags: string[]
  description: string; sourceName: string; sourceUrl: string; updatedAt: string; status: ListingStatus
  commute: Record<Transport, CommuteOption[]>; dataOrigin: DataOrigin; testRegion?: TestRegion; scenarioTags?: string[]
}

export interface SearchPreferences {
  budget: number; commuteLimit: number; arrivalTime: string; commuteMode: 'limit' | 'arrival'
  transport: Transport; routeStrategy: RouteStrategy; timeComfort: number
  rentalType: RentalType | '全部'; bedroomCount: number; minArea: number; maxStationWalkMinutes: number
}

export interface ScoreBreakdown {
  budget: number; area: number; station: number; time: number; transfers: number; walk: number; cost: number
}

export interface RankedListing {
  listing: HousingListing; commute: CommuteOption; fastestCommute: CommuteOption; score: number
  breakdown: ScoreBreakdown; reasons: string[]; label: string; fallbackDifferences?: string[]
}

export interface SearchResponse {
  results: RankedListing[]; mode: DataMode; searchedAt: string; candidateCount: number
  groupCounts: { real: number; synthetic: number; fallback: number }
}

export type AppErrorCode = 'INVITE_REQUIRED' | 'RATE_LIMITED' | 'QUOTA_EXCEEDED' | 'NETWORK_ERROR' | 'INVALID_LOCATION' | 'UNKNOWN'

export class AppError extends Error {
  constructor(public code: AppErrorCode, message: string) { super(message) }
}
