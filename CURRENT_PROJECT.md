# GEO Monitor SaaS — 当前状态

> 生成时间：2026-06-24 | 来源：CURRENT_PROJECT.md 项目恢复交接

---

## 一句话状态

V3 Phase 1 自动化监测已完成、测试通过、提交入库；ECS 部署运行正常（http://123.57.130.223），但离正式上线还差域名/DNS/HTTPS/生产密钥。

---

## 最新验证

| 项目 | 状态 | 说明 |
|------|------|------|
| `npm test` (11 tests, 8 files) | ✅ 全部通过 | Vitest, 含 unit + integration |
| `npm run build` | ✅ 通过 | 16 个路由, 含 Monitoring API |
| ECS HTTP 80 | ✅ 200 OK | Nginx → Next.js standalone |
| ECS Postgres | ✅ 连通 | PrismaPg driver adapter 正常工作 |
| ECS Clerk 注册页 | ✅ 渲染 | /sign-up 加载 Clerk 表单 |
| GitHub 工作树 | ✅ 干净 | 无未提交改动 |

---

## 已完成（V3 Phase 1 自动化监测）

上次交接已完成以下全部任务：

- 自动化监测服务层（provider 抽象 → OpenAI adapter → 单查询执行 → 租户批处理 → 全租户调度）
- Insight snapshot 构建 + 异常提示计算
- 持久化模型：RunBatch, QueryRun, InsightSnapshot, AnomalyFlag
- Vercel Cron 入口（/api/internal/monitoring/run + secret 校验）
- 手动触发接口（/api/monitoring/run + Clerk 认证）
- Dashboard 数据：推荐率、平均排名、竞品、异常提示、最新运行状态
- UI 组件：RunNowButton, QueryRunStatusBadge, AnomalyBanner
- 关键词管理 API（toggle active/inactive）
- 构建/部署兼容修复（prisma.config.ts fallback URL）

---

## 当前部署状态

### ECS（阿里云北京）

| 项目 | 值 |
|------|-----|
| 公网 IP | 123.57.130.223 |
| 端口 | 80 (主), 8080 (备用) |
| 容器 | geo-monitor-app (Next.js) + geo-monitor-postgres (PG16) |
| Nginx | 代理 80/8080 → 127.0.0.1:3000 |
| Prisma | 已执行 migrate deploy |
| 登录 | 通过测试 Clerk 实例可用 |
| SSH key | /private/tmp/codex_geo_monitor_ecs_key |

### Vercel

| 项目 | 值 |
|------|-----|
| 项目 ID | prj_Tk5scaPCSFgijuyKGsJClWq3X7jg |
| Team | qixin-portfolios-projects |
| Preview URL | https://geo-monitor-saas-bo1wivgjy-qixin-portfolios-projects.vercel.app |
| 稳定别名 | https://geo-monitor-saas-qixin-portfolio-qixin-portfolios-projects.vercel.app |
| Neon DB | 条款已接受，但资源未验证 |
| 当前 blocker | 本地无 Vercel token，需用户重新登录 |

---

## 缺失项（须用户操作）

### 1. 生产环境密钥

当前服务器和 .env.local 使用的全是测试/占位值，生产上线前必须替换：

| 变量 | 当前值 | 需替换为 |
|------|--------|----------|
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | pk_test_... | Clerk 生产 publishable key |
| CLERK_SECRET_KEY | sk_test_... | Clerk 生产 secret key |
| STRIPE_WEBHOOK_SECRET | whsec_placeholder | Stripe webhook signing secret |
| OPENAI_API_KEY | 未设置 | 用户自己的 OpenAI API key |
| MONITORING_CRON_SECRET | 未设置 | 随机字符串（用于 Vercel Cron） |

### 2. ECS 域名 & HTTPS

| 项目 | 状态 | 说明 |
|------|------|------|
| geo.cn.mt DNS | ❌ 仍指向占位 IP | 需 DNSHE 面板改为 123.57.130.223 |
| ICP 备案 | ❌ 未关联 | 北京 ECS 需要域名备案后才能公网访问 |
| HTTPS (certbot) | ❌ 未安装 | 需在 DNS 指向 + 备案就绪后配置 |
| 备用方案 | 香港服务器或 Vercel | 无需备案 |

### 3. Vercel 完整部署

| 步骤 | 状态 |
|------|------|
| vercel login — 重新登录账号 | ❌ 需要用户操作 |
| vercel integration add neon — 创建托管 DB | ❌ 条款已接受但未验证 |
| Vercel 环境变量写入 | ❌ 需补全 Clerk/Stripe/Price ID |
| prisma migrate deploy | ❌ Neon 就绪后执行 |
| 重新部署到 production | ❌ 以上完成后再执行 |

---

## 已知问题

| 问题 | 影响 | 处理建议 |
|------|------|----------|
| Failed to find Server Action 日志错误 | 低 — 来自 Clerk 内部 RSC 组件，不影响功能 | 忽略，后续 Clerk 版本可能修复 |
| ECS .env 无 OPENAI_API_KEY | 自动化监测会失败（记录为 failed query run） | 上线前补到服务器 .env 并 podman-compose up -d 重建 |
| ECS .env 无 MONITORING_CRON_SECRET | Cron endpoint 无法验证 | 同上 |
| ECS 服务器 STRIPE_WEBHOOK_SECRET 是占位 | Stripe webhook 不会到达 | 上线前在 Stripe 配 webhook 后填入 |
| ECS 无 HTTPS | 敏感数据传输不安全 | 域名配置后装 certbot |

---

## 推荐下一步（排序）

1. **用户登录 Vercel**（vercel login）或提供 VERCEL_TOKEN
2. **补全 Vercel 部署**（Neon → 环境变量 → migrate → deploy）
3. 或 **走通 ECS 生产路径**（DNSHE 改 geo.cn.mt → 备案/香港服务器 → HTTPS → 生产密钥）
4. **把 OPENAI_API_KEY 和 MONITORING_CRON_SECRET 补到服务器 .env**
5. **决定最终域名**，统一更新 README 和 deploy 文档

---

## 关键文件索引

| 文件 | 用途 |
|------|------|
| README.md | 项目文档 / 部署说明 |
| docker-compose.yml | 容器编排配置 |
| Dockerfile | 构建镜像 |
| deploy/production.env.example | 生产环境变量模板 |
| deploy/nginx/geo-monitor.conf | ECS Nginx 配置 |
| prisma/schema.prisma | 数据库模型 |
| prisma.config.ts | Prisma 运行时配置 |
| src/lib/prisma.ts | Prisma client 单例 |
| src/lib/monitoring/ | V3 自动化监测模块 |
| codex-recovery/ | 历史对话与部署交接文档 |
| docs/superpowers/plans/ | V3 Phase 1 实施计划 |
| docs/superpowers/specs/ | V3 Phase 1 设计文档 |
