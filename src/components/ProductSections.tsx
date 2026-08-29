import { ArrowRight, Calculator, Home, Map, Repeat2, ShieldCheck, WalletCards } from 'lucide-react'

export function ProductSections({ onApiSetup }: { onApiSetup?: () => void }) {
  return <div className="product-content">
    <section id="how" className="content-section"><div className="content-intro"><p className="eyebrow">HOW IT WORKS</p><h2>推荐逻辑不是黑盒</h2><p>先严格筛掉不符合条件的房源，再对剩余房源计算居住与通勤得分。条件不够时宁愿显示空结果，也不会偷偷放宽预算。</p></div><div className="logic-grid"><article><span><ShieldCheck /></span><small>STEP 01</small><h3>执行硬筛选</h3><p>预算、整租或合租、户型、面积、地铁步行和最长通勤必须全部符合。</p></article><article><span><Map /></span><small>STEP 02</small><h3>批量计算通勤</h3><p>比较时间、换乘、路线步行与费用，并允许选择最快或少换乘等策略。</p></article><article><span><Calculator /></span><small>STEP 03</small><h3>透明评分排序</h3><p>预算 25 分、面积 5 分、地铁距离 10 分、通勤 60 分，最终返回前 10 套。</p></article></div><div className="tradeoff-example"><div><Repeat2 /><strong>你的核心场景</strong></div><p>如果一条路线只慢 8 分钟，却可以少换乘 1 次，系统会根据“舒适—时间”滑杆调整排名，并直接说明这项取舍。</p><div className="example-routes"><span>最快路线 <b>28 分钟 · 换乘 1 次</b></span><ArrowRight /><span className="recommended">舒适路线 <b>36 分钟 · 0 换乘</b></span></div></div></section>
    <section id="about" className="content-section about-section"><div className="content-intro"><p className="eyebrow">ABOUT ZHUDEJIN</p><h2>地图算路线，我们帮助你选房</h2><p>租房平台告诉你有哪些房子，高德或百度告诉你一条路线怎么走；住得近把两类信息组合起来，回答“哪些房子值得优先看”。</p></div><div className="about-grid"><article><Home /><h3>不是租房交易平台</h3><p>不提供支付和签约，只保留合法房源来源链接，方便回到来源平台核验。</p></article><article><WalletCards /><h3>减少重复比较</h3><p>不用在租房平台和地图之间反复复制几十次地址，一次设置即可统一比较。</p></article><article><KeyRoundIcon /><h3>真实服务已连接</h3><p>地图与后端配置由部署环境统一管理，受邀用户无需接触或填写任何 API 配置。</p>{onApiSetup && <button onClick={onApiSetup}>打开 API 配置</button>}</article></div></section>
  </div>
}

function KeyRoundIcon() { return <span className="inline-key" aria-hidden="true">API</span> }
