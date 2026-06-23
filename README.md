# GEO Monitor SaaS MVP

第一版目标：一个真实可上线的 GEO Monitor SaaS。当前已经有 SaaS 基础壳和 V1 手动监测。

## 功能

- Clerk 登录/注册
- Tenant 企业空间
- Stripe 测试模式订阅
- Prisma + Postgres
- 套餐关键词限制
- Dashboard 数据看板
- V1 手动 GEO 监测：录入 AI 回答、品牌提及、排名、竞品
- 香港/国内云服务器 Docker + Postgres 生产部署方案
- Vercel 备选部署

## 本地启动

```bash
cp .env.example .env
docker compose up -d postgres
npm install
npm run prisma:migrate
npm run dev
```

访问：

```text
http://localhost:3000
```

## Stripe 测试模式

需要在 Stripe 创建 3 个订阅价格，并写入 `.env`：

```text
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=
NEXT_PUBLIC_STRIPE_AGENCY_PRICE_ID=
```

Webhook endpoint：

```text
https://geoup.online/api/stripe/webhook
```

Events：

```text
checkout.session.completed
customer.subscription.updated
customer.subscription.deleted
```

## Clerk 配置

创建 Clerk 应用后填写：

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

登录/注册路径：

```text
/sign-in
/sign-up
```

## 生产部署建议

如果目标客户主要在中国大陆，正式入口优先用香港云服务器或已备案的国内云服务器，不建议把 Vercel 当国内客户主入口。

当前项目已确认：

```text
正式域名：geoup.online
ECS 公网 IP：123.57.130.223
```

我在 `2026-06-23` 实查到：

```text
geoup.online -> 198.18.0.173
www.geoup.online -> 198.18.0.174
```

这说明当前 DNS 还没有正式切到 ECS。先把 `@` 和 `www` 的解析改到 `123.57.130.223`，再继续做 HTTPS、Clerk 正式域名和 Stripe Webhook。

推荐顺序：

1. 先把 `geoup.online` 和 `www.geoup.online` 的 DNS 解析切到 `123.57.130.223`。
2. 确认域名已能稳定打开 ECS 首页，再排查备案 / 接入链路。
3. 用 Nginx 反向代理正式域名到本机 Docker App。
4. 先签 HTTPS，再更新 Clerk 生产域名和 Stripe Webhook。
5. 保留 Vercel 作为预览 / 备用演示环境，不把它当大陆正式入口。

## 服务器 Docker 部署

```bash
cp deploy/production.env.example .env
docker compose up --build -d
docker compose exec app npx prisma migrate deploy
```

注意：`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`、`NEXT_PUBLIC_APP_URL`、`NEXT_PUBLIC_STRIPE_*_PRICE_ID` 这类 `NEXT_PUBLIC_` 变量会参与前端构建。正式部署前先把 `.env` 填好，再执行 `docker compose up --build -d`。

如果 Docker Hub 拉镜像超时，`.env.example` 已默认使用国内镜像：

```text
BASE_IMAGE=docker.m.daocloud.io/library/node:20-alpine
POSTGRES_IMAGE=docker.m.daocloud.io/library/postgres:16-alpine
```

Compose 默认只把 App 和 Postgres 绑定到服务器本机：

```text
127.0.0.1:3000 -> Next.js App
127.0.0.1:5432 -> Postgres
```

这样外部用户不能直接访问数据库，只能通过 Nginx 访问网站。

### Nginx 反向代理

复制模板：

```bash
sudo cp deploy/nginx/geo-monitor.conf /etc/nginx/sites-available/geo-monitor.conf
sudo ln -s /etc/nginx/sites-available/geo-monitor.conf /etc/nginx/sites-enabled/geo-monitor.conf
sudo nginx -t
sudo systemctl reload nginx
```

把模板里的域名：

```text
geoup.online
www.geoup.online
```


### HTTPS 证书

服务器上安装 Certbot 后执行：

```bash
sudo certbot --nginx -d geoup.online -d www.geoup.online
```

### Stripe Webhook

生产域名配置好后，在 Stripe Dashboard 新建 Webhook endpoint：

```text
https://geoup.online/api/stripe/webhook
```

选择事件：

```text
checkout.session.completed
customer.subscription.updated
customer.subscription.deleted
```

然后把 Stripe 给的 `whsec_...` 填到生产服务器 `.env` 的：

```text
STRIPE_WEBHOOK_SECRET=
```

再重启：

```bash
docker compose up --build -d
```

### Clerk 生产配置

Clerk Dashboard 里需要配置：

```text
Production instance
Application domain: https://geoup.online
Sign-in URL: /sign-in
Sign-up URL: /sign-up
After sign-in URL: /dashboard
After sign-up URL: /dashboard
```

然后把生产环境的：

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

填入服务器 `.env`，重新构建部署。

### 大陆访问说明

- 香港服务器：通常大陆可访问，速度和稳定性取决于云厂商线路。
- 国内服务器：访问更稳，但网站域名通常需要 ICP 备案。
- Stripe 和 Clerk 都是海外服务，国内访问不完全可控。第一版可以先跑通，真实商业化后建议补微信支付/支付宝或人工开通套餐。

## Vercel 备选部署

1. 创建 Postgres 数据库。
2. 在 Vercel 设置 `DATABASE_URL`。
3. 设置 Clerk 环境变量。
4. 设置 Stripe 环境变量。
5. 部署项目。
6. 将 Stripe webhook 指向 Vercel 域名。
7. 执行生产迁移：`npx prisma migrate deploy`。

## 验收项

- 未登录访问 `/dashboard` 会跳转登录。
- 注册后进入 Dashboard 自动创建企业空间。
- 免费用户最多创建 3 个关键词。
- Starter 最多 5 个关键词。
- Pro 最多 30 个关键词。
- Agency 可创建大量关键词。
- Pricing 可以创建 Stripe Checkout。
- Stripe Webhook 可以更新套餐。
- Billing 可以进入 Stripe Customer Portal。
- 手动录入 AI 回答后 Dashboard 显示推荐率和竞品。

## 暂不实现

- 多 AI API
- Redis 队列
- 自动报告 PDF
- 多成员团队
- 代理商子账号
