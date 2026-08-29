import { describe, expect, it } from 'vitest'
import { demoListings } from '../data'
import type { SearchPreferences } from '../types'
import { getCommuteWeights, rankListings } from './recommend'

const preferences = (changes: Partial<SearchPreferences> = {}): SearchPreferences => ({
  budget: 5500, commuteLimit: 60, arrivalTime: '09:00', commuteMode: 'limit', transport: '公共交通', routeStrategy: 'fastest',
  timeComfort: 50, rentalType: '全部', bedroomCount: 0, minArea: 0, maxStationWalkMinutes: 0, ...changes,
})

describe('租房推荐', () => {
  it('硬条件无匹配时返回空数组，不自动放宽预算', () => {
    expect(rankListings(demoListings, preferences({ budget: 2000 }))).toEqual([])
  })

  it('严格应用租赁类型、面积和地铁步行筛选', () => {
    const results = rankListings(demoListings, preferences({ rentalType: '整租', minArea: 40, maxStationWalkMinutes: 6 }))
    expect(results.length).toBeGreaterThan(0)
    expect(results.every(({ listing }) => listing.rentalType === '整租' && listing.area >= 40 && listing.stationWalkMinutes <= 6)).toBe(true)
  })

  it('舒适优先选择慢不超过10分钟且少换乘的路线，并解释差异', () => {
    const listing = demoListings.find((item) => item.id === 'hongqiao-yunji')!
    const [result] = rankListings([listing], preferences({ routeStrategy: 'least-transfer', timeComfort: 0 }))
    expect(result.commute.time).toBe(36)
    expect(result.commute.transfers).toBe(0)
    expect(result.reasons[0]).toContain('慢 8 分钟，但少换乘 1 次')
  })

  it('通勤子权重在滑杆两端都保持总计60分', () => {
    expect(Object.values(getCommuteWeights(0)).reduce((a, b) => a + b, 0)).toBe(60)
    expect(Object.values(getCommuteWeights(100)).reduce((a, b) => a + b, 0)).toBe(60)
    expect(getCommuteWeights(100).time).toBe(40)
    expect(getCommuteWeights(0).transfers).toBe(20)
  })
})
