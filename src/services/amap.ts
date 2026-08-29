import AMapLoader from '@amap/amap-jsapi-loader'
import type { WorkLocation } from '../types'

declare global { interface Window { _AMapSecurityConfig?: { securityJsCode: string } } }
let amapPromise: Promise<any> | null = null

export const getAmapBrowserConfig = () => ({
  key: import.meta.env.VITE_DISABLE_EXTERNAL_APIS === 'true' ? '' : (typeof window !== 'undefined' && localStorage.getItem('zhudejin-amap-js-key')) || import.meta.env.VITE_AMAP_JS_KEY || '',
  securityCode: import.meta.env.VITE_DISABLE_EXTERNAL_APIS === 'true' ? '' : (typeof window !== 'undefined' && localStorage.getItem('zhudejin-amap-security-code')) || import.meta.env.VITE_AMAP_SECURITY_CODE || '',
})

export const hasAmapConfig = () => Boolean(getAmapBrowserConfig().key)

export const loadAmap = () => {
  const config = getAmapBrowserConfig()
  if (!config.key) return Promise.reject(new Error('未配置高德 JS Key'))
  if (!amapPromise) {
    if (config.securityCode) window._AMapSecurityConfig = { securityJsCode: config.securityCode }
    amapPromise = AMapLoader.load({ key: config.key, version: '2.0', plugins: ['AMap.Geocoder', 'AMap.Scale', 'AMap.ToolBar'] })
  }
  return amapPromise
}

export const geocodeShanghaiAddress = async (address: string): Promise<WorkLocation> => {
  const AMap = await loadAmap()
  return new Promise((resolve, reject) => {
    const geocoder = new AMap.Geocoder({ city: '上海', citylimit: true })
    geocoder.getLocation(address, (status: string, result: any) => {
      const geocode = result?.geocodes?.[0]
      if (status !== 'complete' || !geocode?.location) return reject(new Error('没有在上海找到这个工作地点'))
      resolve({ id: `amap-${geocode.location.lng}-${geocode.location.lat}`, name: geocode.formattedAddress || address, subtitle: `${geocode.district || '上海'} · 高德地址解析`, coords: [geocode.location.lat, geocode.location.lng] })
    })
  })
}
