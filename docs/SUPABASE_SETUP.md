# Supabase 配置指南

## 1. 创建项目并应用数据库

安装 Supabase CLI 后登录并关联项目：

```bash
npx supabase login
npx supabase link --project-ref <你的项目编号>
npx supabase db push
```

迁移会建立房源、邀请码会话、路线缓存、反馈、搜索日志、管理员和路线核验表，并启用 RLS。

## 2. 配置服务端 Secrets

```bash
npx supabase secrets set AMAP_WEB_SERVICE_KEY=<高德Web服务Key>
npx supabase secrets set BAIDU_WEB_SERVICE_KEY=<百度服务端AK>
npx supabase secrets set CRON_SECRET=<随机长字符串>
npx supabase secrets set ALLOWED_ORIGIN=https://zeyuan-ai.github.io
```

这些值不得使用 `VITE_` 前缀，也不得写入 Git。高德 JS Key 和安全码是浏览器配置，需要分别限制允许域名。

## 3. 部署函数

```bash
npx supabase functions deploy
```

部署后在 GitHub Pages 的 Repository Variables 配置 `VITE_AMAP_JS_KEY`、`VITE_AMAP_SECURITY_CODE`、`VITE_SUPABASE_URL` 和 `VITE_SUPABASE_PUBLISHABLE_KEY`。构建工作流固定使用 `VITE_DATA_MODE=staging`。Publishable key 可以在启用 RLS 后用于浏览器；secret key 永远不能进入浏览器。

服务端通过 Supabase Secret `DATA_MODE` 固定数据模式，内测为 `staging`，正式环境为 `production`。浏览器请求和网址参数都不能修改此值。切换正式环境前必须先导出或删除 `data_origin='synthetic'` 的测试数据，并执行 production 负向测试。

## 4. 初始化运营数据

1. 在 Supabase Auth 创建管理员账号。
2. 将用户 UUID 插入 `public.admins`。
3. 通过 SQL 生成邀请码 SHA-256，数据库不保存邀请码明文。
4. 录入合法来源的上海房源，并将审核完成的记录设为 `active`。
5. 使用 Supabase Cron 每日调用 `purge_expired_product_data()`。
6. 使用带 `x-cron-secret` 的计划任务每日调用 `route-audit`。
