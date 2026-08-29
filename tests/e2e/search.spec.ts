import { expect, test } from '@playwright/test'

test('展示严格匹配结果并可加入对比', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /严格匹配 \d+ 套/ })).toBeVisible()
  await page.getByRole('button', { name: '加入对比' }).first().click()
  await expect(page.getByRole('button', { name: '开始对比' })).toBeVisible()
  await page.getByRole('button', { name: '开始对比' }).click()
  await expect(page.getByRole('dialog', { name: '房源对比' })).toBeVisible()
})

test('四种通勤方式切换后都能重新计算并显示结果', async ({ page }, testInfo) => {
  await page.goto('/')
  const mobile = testInfo.project.name.includes('mobile')
  if (mobile) await page.getByRole('button', { name: '筛选条件' }).click()
  await page.locator('.range-field input[type="range"]').fill('90')
  for (const mode of ['公交地铁', '驾车', '骑行', '步行']) {
    if (mobile && !(await page.getByRole('button', { name: mode, exact: true }).isVisible())) await page.getByRole('button', { name: '筛选条件' }).click()
    await page.getByRole('button', { name: mode, exact: true }).click()
    await expect(page.getByRole('heading', { name: /严格匹配 \d+ 套/ })).toBeVisible()
    await expect(page.locator('.listing-card').first()).toBeVisible()
  }
})

test('硬筛选无结果时不自动放宽', async ({ page }) => {
  await page.goto('/')
  if ((page.viewportSize()?.width || 0) < 900) await page.getByRole('button', { name: '筛选条件' }).click()
  for (let index = 0; index < 7; index++) await page.locator('.budget-control > button').first().click()
  await page.getByRole('button', { name: '查看匹配房源' }).click()
  await expect(page.getByText('没有完全符合条件的房源')).toBeVisible()
  await expect(page.getByText('我们没有擅自放宽预算或面积')).toBeVisible()
})

test('演示底图、说明区块和 API 配置入口可访问', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.leaflet-container')).toBeVisible()
  await expect(page.getByText(/OpenStreetMap 演示底图/)).toBeVisible()
  const mobile = (page.viewportSize()?.width || 0) < 900
  if (mobile) await page.getByRole('button', { name: '菜单' }).click()
  await page.locator(`${mobile ? '.mobile-nav ' : '.top-nav '}a[href="#how"]`).click()
  await expect(page.getByRole('heading', { name: '推荐逻辑不是黑盒' })).toBeVisible()
  if (mobile) await page.getByRole('button', { name: '菜单' }).click()
  await page.locator(`${mobile ? '.mobile-nav ' : '.top-nav '}a[href="#about"]`).click()
  await expect(page.getByRole('heading', { name: '地图算路线，我们帮助你选房' })).toBeVisible()
  await page.getByRole('button', { name: /API 配置/ }).first().click()
  await expect(page.getByRole('dialog', { name: 'API 配置' })).toBeVisible()
  await expect(page.getByText('服务端密钥不能在这里填写')).toBeVisible()
})

test('无高德配置时任意地址给出明确提示而不是伪装成预置区域', async ({ page }, testInfo) => {
  await page.goto('/')
  if (testInfo.project.name.includes('mobile')) await page.getByRole('button', { name: '筛选条件' }).click()
  const input = page.getByRole('textbox', { name: '工作地点' })
  await input.fill('上海静安寺')
  await page.getByRole('button', { name: '定位工作地点' }).click()
  await expect(page.getByText(/搜索任意上海地址需要先配置高德Web端Key/)).toBeVisible()
})
