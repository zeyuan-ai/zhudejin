import { describe, expect, it } from 'vitest'
import { createSyntheticRoutes, selectNearestListings, stagingOffices, trafficPeriod } from '../../supabase/functions/_shared/synthetic'

describe('内测固定路线', () => {
  it('覆盖五个办公区域与四种通勤方式', () => {
    expect(stagingOffices).toHaveLength(5)
    for (const mode of ['公共交通', '驾车', '骑行', '步行']) {
      expect(createSyntheticRoutes('fixed-listing', mode, '09:00').length).toBeGreaterThan(0)
    }
  })

  it('相同输入始终得到相同结果', () => {
    expect(createSyntheticRoutes('fixed-listing', '公共交通', '09:00')).toEqual(createSyntheticRoutes('fixed-listing', '公共交通', '09:00'))
  })

  it('少换乘路线比最快慢6至10分钟且少一次换乘', () => {
    const routes = createSyntheticRoutes('core-case', '公共交通', '09:00')
    const fastest = routes.find((route) => route.strategy === 'fastest')!
    const comfortable = routes.find((route) => route.strategy === 'least-transfer')!
    expect(comfortable.time - fastest.time).toBeGreaterThanOrEqual(6)
    expect(comfortable.time - fastest.time).toBeLessThanOrEqual(10)
    expect(fastest.transfers - comfortable.transfers).toBe(1)
  })

  it('早晚高峰可识别，驾车高峰时间高于平峰', () => {
    expect(trafficPeriod('09:00')).toBe('morning-peak')
    expect(trafficPeriod('18:30')).toBe('evening-peak')
    expect(trafficPeriod('14:00')).toBe('off-peak')
    const peak = createSyntheticRoutes('drive-case', '驾车', '09:00')[0]
    const offPeak = createSyntheticRoutes('drive-case', '驾车', '14:00')[0]
    expect(peak.time).toBeGreaterThan(offPeak.time)
  })

  it('任意地址只选最近的12套候选，不修改原数组', () => {
    const listings = Array.from({ length: 20 }, (_, index) => ({ id: String(index), latitude: 31.2 + index * .01, longitude: 121.4 }))
    const original = [...listings]
    const selected = selectNearestListings(listings, [31.2, 121.4], 12)
    expect(selected).toHaveLength(12)
    expect(selected[0].id).toBe('0')
    expect(selected[11].id).toBe('11')
    expect(listings).toEqual(original)
  })
})
