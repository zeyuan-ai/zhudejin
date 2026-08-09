import type { CommuteOption, HousingListing, RankedListing, SearchPreferences } from '../types'

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))

export const getCommute = (listing: HousingListing, transport: SearchPreferences['transport']): CommuteOption => {
  return listing.commute[transport] ?? listing.commute['地铁']
}

export const rankListings = (listings: HousingListing[], preferences: SearchPreferences): RankedListing[] => {
  return listings
    .map((listing) => {
      const commute = getCommute(listing, preferences.transport)
      const isWithinBudget = listing.rent <= preferences.budget
      const isWithinTime = commute.time <= preferences.commuteLimit
      const budgetFit = clamp(1 - Math.max(0, listing.rent - preferences.budget) / 1800)
      const timeFit = clamp(1 - Math.max(0, commute.time - preferences.commuteLimit) / 40)
      const comfortFit = clamp(
        0.52 * (1 - commute.transfers / 3) +
          0.25 * (1 - commute.walk / 30) +
          0.23 * (commute.reliability / 100),
      )
      const timeWeight = preferences.timeComfort / 100
      const score = Math.round(
        (budgetFit * 0.36 + timeFit * (0.18 + timeWeight * 0.23) + comfortFit * (0.12 + (1 - timeWeight) * 0.11)) * 100,
      )
      const label = commute.transfers === 0 && isWithinTime ? '少换乘优先' : isWithinBudget ? '性价比不错' : '通勤效率高'

      return { listing, commute, score: Math.min(score, 99), isWithinBudget, isWithinTime, label }
    })
    .sort((a, b) => b.score - a.score)
}
