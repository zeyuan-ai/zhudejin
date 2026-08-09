# 住得近 · 工作找房

一个从工作地点出发，综合租金、通勤时间和换乘舒适度的找房产品原型。

## 本地运行

```bash
npm install
npm run dev
```

## 构建检查

```bash
npm run build
```

## GitHub Pages

项目已包含 `.github/workflows/deploy.yml`。把项目推送到 GitHub 的 `main` 分支后，在仓库设置中将 Pages 的来源设置为 **GitHub Actions**，之后每次推送都会自动构建和发布。

第一版使用 OpenStreetMap 地图和本地演示房源数据，评分规则位于 `src/lib/recommend.ts`。后续接入真实地图、交通或房源接口时，可以替换数据层，不必重做页面。
