# 住得近 · 从工作地点开始找房

住得近不是另一个导航软件，而是位于房源与地图之间的租房决策层。用户输入上海工作地点和不可放宽的租房条件，系统批量比较候选房源的租金、面积、地铁距离、通勤时间、换乘、步行和费用，返回可解释的前 10 条推荐。

线上演示：[zeyuan-ai.github.io/zhudejin](https://zeyuan-ai.github.io/zhudejin/)

## 当前能力

- 预算、整租/合租、户型、面积、地铁步行和最长通勤严格筛选。
- 公共交通、驾车、骑行和步行；公共交通支持最快、少换乘、少步行、地铁优先和避开地铁。
- “舒适—时间”权重、100 分透明评分和自然语言推荐理由。
- 高德 JS API 地图与上海地址解析；未配置时显示明确标识的演示地图。
- 收藏、最多 3 套并排对比、来源与更新时间、推荐反馈。
- Supabase 邀请码、限流、房源、路线缓存、反馈、日志、管理和百度抽样核验后端。
- GitHub Pages 自动部署、单元测试和密钥扫描。

## 本地运行

Windows 用户可以直接双击项目根目录的 `一键启动住得近.cmd`，浏览器会自动打开。

```bash
npm install
npm run dev
```

默认不需要密钥，会使用本地演示房源和演示地图。需要高德地图或 Supabase 时，复制 `.env.example` 为 `.env.local`，只填写浏览器可公开配置。`VITE_DATA_MODE=staging` 用于内测；生产构建必须改成 `production`，生产模式不会回退到模拟数据。

```bash
npm run test
npm run build
npm run test:e2e
npm run check
```

首次执行端到端测试前安装 Chromium：

```bash
npx playwright install chromium
```

## 项目结构

- `src/`：React 前端、评分规则、地图和 API 适配。
- `supabase/`：数据库迁移、Edge Functions 和初始化说明。
- `tests/e2e/`：桌面与移动端关键流程测试。
- `docs/PRD.md`：完整 MVP 产品需求。
- `docs/ARCHITECTURE.md`：架构、安全边界和数据流。
- `docs/SUPABASE_SETUP.md`：后端部署步骤。
- `思考思路.md`：产品决策和阶段进度记录。

## 配置安全

所有 `VITE_` 变量都会进入浏览器构建，只能存放高德 JS Key、Supabase URL 和 publishable key，并需要配置允许域名与 RLS。高德 Web 服务 Key、百度 AK、Supabase secret key 和定时任务密钥只能放在 Supabase Secrets 或 GitHub Secrets，不能提交到仓库。

提交前运行 `npm run security:check`。详细配置见 [Supabase 配置指南](docs/SUPABASE_SETUP.md)。

## 企业化更新流程

1. 从最新 `main` 创建 `feat/<功能名>` 或 `fix/<问题名>` 分支。
2. 修改代码，并同步 PRD、测试和“思考思路”。
3. 执行 `npm run check`。
4. 提交并推送功能分支，创建 Pull Request。
5. 等待 Quality checks 通过后合并到 `main`。
6. GitHub Pages 自动部署；后端变更通过手动的 Deploy Supabase backend 工作流发布。

房源必须来自人工维护或合法授权来源。本项目不抓取未授权平台数据，也不在站内提供交易、支付或签约。
