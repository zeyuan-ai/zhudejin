import type { CommuteOption, HousingListing, RouteStrategy, Transport, WorkLocation } from './types'

export const transportOptions: Array<{ value: Transport; label: string }> = [
  { value: '公共交通', label: '公交地铁' }, { value: '驾车', label: '驾车' }, { value: '骑行', label: '骑行' }, { value: '步行', label: '步行' },
]

export const routeStrategies: Array<{ value: RouteStrategy; label: string }> = [
  { value: 'fastest', label: '最快' }, { value: 'least-transfer', label: '少换乘' }, { value: 'least-walk', label: '少步行' },
  { value: 'metro-first', label: '地铁优先' }, { value: 'avoid-metro', label: '避开地铁' },
]

export const stagingOffices: WorkLocation[] = [
  { id: 'hongqiao', testRegion: 'hongqiao', name: '上海虹桥商务区', subtitle: '长宁区 · 闵行区交界', coords: [31.1979, 121.3211] },
  { id: 'lujiazui', testRegion: 'lujiazui', name: '陆家嘴金融城', subtitle: '浦东新区 · 陆家嘴', coords: [31.2397, 121.4998] },
  { id: 'peoples-square', testRegion: 'peoples-square', name: '人民广场', subtitle: '黄浦区 · 人民广场', coords: [31.2304, 121.4737] },
  { id: 'xujiahui', testRegion: 'xujiahui', name: '徐家汇商圈', subtitle: '徐汇区 · 徐家汇', coords: [31.1885, 121.4365] },
  { id: 'zhangjiang', testRegion: 'zhangjiang', name: '张江科学城', subtitle: '浦东新区 · 张江', coords: [31.2036, 121.6014] },
]
export const demoOffice: WorkLocation = stagingOffices[0]

const route = (id: string, mode: Transport, strategy: RouteStrategy, time: number, transfers: number, walk: number, cost: number, reliability: number, summary: string): CommuteOption =>
  ({ id, mode, strategy, time, transfers, walk, cost, reliability, summary })

const otherRoutes = (seed: number): Pick<Record<Transport, CommuteOption[]>, '驾车' | '骑行' | '步行'> => ({
  驾车: [route(`drive-${seed}`, '驾车', 'fastest', 16 + seed * 2, 0, 2, 7 + seed, 65, '工作日高峰驾车')],
  骑行: [route(`bike-${seed}`, '骑行', 'fastest', 19 + seed * 3, 0, 1, 0, 78, '城市道路骑行')],
  步行: [route(`walk-${seed}`, '步行', 'fastest', 51 + seed * 7, 0, 0, 0, 88, '全程步行')],
})

export const demoListings: HousingListing[] = [
  {
    id: 'hongqiao-yunji', title: '虹桥云际一居', district: '闵行 · 龙柏新村', address: '金汇路 88 弄', coords: [31.1765, 121.361],
    rent: 4200, rentalType: '整租', bedroomCount: 1, bedrooms: '一室一厅', area: 43,
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=85', station: '龙溪路站', stationWalkMinutes: 6,
    buildYear: 2016, highlights: ['朝南采光', '独立厨房', '物业安静'], tags: ['少换乘', '采光好'], description: '适合希望住得安静、每天通勤路线简单的上班族。',
    sourceName: '演示房源', sourceUrl: '', updatedAt: '2026-08-22', status: 'active', dataOrigin: 'synthetic', testRegion: 'hongqiao', scenarioTags: ['baseline'],
    commute: { 公共交通: [route('hy-fast', '公共交通', 'fastest', 28, 1, 12, 4, 89, '10 号线换乘 2 号线'), route('hy-easy', '公共交通', 'least-transfer', 36, 0, 7, 4, 93, '10 号线接驳直达')], ...otherRoutes(1) },
  },
  {
    id: 'gubei-qingju', title: '古北轻居公寓', district: '长宁 · 古北', address: '黄金城道 218 号', coords: [31.192, 121.397],
    rent: 4900, rentalType: '整租', bedroomCount: 1, bedrooms: '一室一厅', area: 39,
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=85', station: '伊犁路站', stationWalkMinutes: 4,
    buildYear: 2020, highlights: ['精装拎包住', '商业丰富', '门禁严格'], tags: ['生活方便', '精装修'], description: '周边餐饮和便利店密集，适合下班后缩短生活半径。',
    sourceName: '演示房源', sourceUrl: '', updatedAt: '2026-08-21', status: 'active', dataOrigin: 'synthetic', testRegion: 'hongqiao', scenarioTags: ['baseline'],
    commute: { 公共交通: [route('gq-fast', '公共交通', 'fastest', 31, 1, 7, 4, 93, '10 号线换乘 2 号线'), route('gq-walk', '公共交通', 'least-walk', 35, 1, 3, 4, 90, '短步行接驳')], ...otherRoutes(2) },
  },
  {
    id: 'hanghua-living', title: '航华生活里', district: '闵行 · 航华', address: '航新路 399 弄', coords: [31.159, 121.327],
    rent: 3500, rentalType: '合租', bedroomCount: 2, bedrooms: '两室一厅合租', area: 26,
    image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1000&q=85', station: '航中路站', stationWalkMinutes: 9,
    buildYear: 2013, highlights: ['预算友好', '采买方便', '室友作息稳定'], tags: ['性价比', '0 换乘'], description: '适合刚入职、希望控制租金压力的合租用户。',
    sourceName: '演示房源', sourceUrl: '', updatedAt: '2026-08-20', status: 'active', dataOrigin: 'synthetic', testRegion: 'hongqiao', scenarioTags: ['baseline'],
    commute: { 公共交通: [route('hl-fast', '公共交通', 'fastest', 33, 1, 10, 4, 86, '地铁换乘一次'), route('hl-easy', '公共交通', 'least-transfer', 42, 0, 8, 2, 91, '公交直达，不用换乘'), route('hl-bus', '公共交通', 'avoid-metro', 45, 0, 6, 2, 82, '全程公交')], ...otherRoutes(3) },
  },
  {
    id: 'zhongshan-park', title: '中山公园松间', district: '长宁 · 中山公园', address: '愚园路 1288 号', coords: [31.221, 121.405],
    rent: 5300, rentalType: '整租', bedroomCount: 1, bedrooms: '一室一厅', area: 45,
    image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1000&q=85', station: '中山公园站', stationWalkMinutes: 5,
    buildYear: 2018, highlights: ['商圈成熟', '收纳充足', '采光通透'], tags: ['通勤快', '生活丰富'], description: '用更高预算换取成熟商圈和更快的通勤。',
    sourceName: '演示房源', sourceUrl: '', updatedAt: '2026-08-22', status: 'active', dataOrigin: 'synthetic', testRegion: 'hongqiao', scenarioTags: ['baseline'],
    commute: { 公共交通: [route('zp-fast', '公共交通', 'fastest', 24, 1, 6, 4, 94, '2 号线换乘 10 号线'), route('zp-easy', '公共交通', 'least-transfer', 34, 0, 5, 3, 91, '公交专线直达')], ...otherRoutes(4) },
  },
  {
    id: 'qibao-riverside', title: '七宝河畔一室', district: '闵行 · 七宝', address: '漕宝路 1555 弄', coords: [31.153, 121.342],
    rent: 3800, rentalType: '整租', bedroomCount: 1, bedrooms: '一室一厅', area: 41,
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=85', station: '七宝站', stationWalkMinutes: 8,
    buildYear: 2015, highlights: ['临近商场', '有阳台', '绿化好'], tags: ['生活感', '有阳台'], description: '通勤多几分钟，换来更完整的社区生活。',
    sourceName: '演示房源', sourceUrl: '', updatedAt: '2026-08-19', status: 'active', dataOrigin: 'synthetic', testRegion: 'hongqiao', scenarioTags: ['baseline'],
    commute: { 公共交通: [route('qr-fast', '公共交通', 'fastest', 39, 2, 13, 5, 82, '9 号线两次换乘'), route('qr-easy', '公共交通', 'least-transfer', 48, 0, 9, 2, 90, '公交直达，不用换乘')], ...otherRoutes(5) },
  },
  {
    id: 'xujing-shared', title: '徐泾合租次卧', district: '青浦 · 徐泾', address: '盈港东路 1888 弄', coords: [31.1905, 121.285],
    rent: 2800, rentalType: '合租', bedroomCount: 3, bedrooms: '三室合租', area: 20,
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=85', station: '徐泾东站', stationWalkMinutes: 12,
    buildYear: 2014, highlights: ['租金低', '近公司', '民用水电'], tags: ['预算友好', '通勤稳定'], description: '适合把预算放在首位、可以接受合租的用户。',
    sourceName: '演示房源', sourceUrl: '', updatedAt: '2026-08-18', status: 'active', dataOrigin: 'synthetic', testRegion: 'hongqiao', scenarioTags: ['baseline'],
    commute: { 公共交通: [route('xs-fast', '公共交通', 'fastest', 22, 0, 10, 3, 92, '2 号线直达')], ...otherRoutes(1) },
  },
]
