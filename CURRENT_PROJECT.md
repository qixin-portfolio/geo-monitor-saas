# GEO Monitor SaaS — 当前状态

> 更新时间：2026-06-24 | 本轮：DeepSeek provider + UI/UX 优化

---

## 一句话状态

V3 Phase 1 自动化监测 + DeepSeek provider + UI/UX 优化全部完成。等 `shengjingjc.cn` 备案完成后备案 `geo.cn.mt`，再切回 ECS。本地需配置 `DEEPSEEK_API_KEY`。

---

## 最新验证

| 项目 | 状态 | 说明 |
|------|------|------|
| `npm test` (11 tests, 8 files) | ✅ 全部通过 | Vitest, 含 unit + integration |
| `npm run build` | ✅ 通过 | 18 个路由, 含导出报告 API |
| Git 工作树 | ✅ 干净 | 分支 codex/geo-monitor-v3-phase-1 |
| ECS HTTP 80 | ✅ 200 OK | Nginx → Next.js standalone |
| ECS Postgres | ✅ 连通 | PrismaPg driver adapter 正常工作 |

---

## 已完成（本轮新增）

### DeepSeek Provider 支持

- 新增 `src/lib/monitoring/deepseek-provider.ts`（DeepSeek Chat Completions API）
- `config.ts` 新增 `createProvider()` 工厂方法，环境变量 `MONITORING_PROVIDER` 控制切换
- 默认模型自动匹配：`deepseek-chat`（DeepSeek）/ `gpt-4o-mini`（OpenAI）
- `.env.local` 已配置 `MONITORING_PROVIDER=deepseek`，需填入 `DEEPSEEK_API_KEY`

### UI/UX 优化

- **状态徽章**：颜色编码（成功=绿/失败=红/运行中=蓝/排队=黄）
- **AnomalyBanner**：带 AlertTriangle 图标 + 结构化列表展示
- **RunNowButton**：实时反馈（loading spinner + 成功/错误消息，不再整页刷新）
- **侧边栏导航**：当前页面高亮 + lucide 图标（`sidebar-nav.tsx` 客户端组件）
- **趋势图表**：SVG 折线图展示推荐率变化（`trend-chart.tsx`）
- **导出报告**：Markdown 格式下载（/api/report/export）

### 已完成（V3 Phase 1 自动化监测）

- 自动化监测服务层（provider 抽象 → 单查询执行 → 租户批处理 → 全租户调度）
- Insight snapshot 构建 + 异常提示计算
- 持久化模型：RunBatch, QueryRun, InsightSnapshot, AnomalyFlag
- Vercel Cron 入口 + 手动触发接口
- Dashboard 数据：推荐率、平均排名、竞品、异常提示、最新运行状态
- 关键词管理 API（toggle active/inactive）

---

## 当前部署状态

### ECS（阿里云北京）

| 项目 | 值 |
|------|-----|
| 公网 IP | 123.57.130.223 |
| 端口 | 80 (主), 8080 (备用) |
| 容器 | geo-monitor-app (Next.js) + geo-monitor-postgres (PG16) |
| SSH key | /private/tmp/codex_geo_monitor_ecs_key |

### Vercel

| 项目 | 值 |
|------|-----|
| 项目 ID | prj_Tk5scaPCSFgijuyKGsJClWq3X7jg |
| Team | qixin-portfolios-projects |
| 稳定别名 | https://geo-monitor-saas-qixin-portfolio-qixin-portfolios-projects.vercel.app |

---

## 缺失项（须用户操作）

| 变量 | 说明 |
|------|------|
| `DEEPSEEK_API_KEY` | 本地 .env.local 需填入，才能跑 DeepSeek 监测 |
| `MONITORING_CRON_SECRET` | Vercel Cron 需要的密钥 |
| `STRIPE_WEBHOOK_SECRET` | 上线前在 Stripe 配 webhook 后填入 |
| `OPENAI_API_KEY` | 如需 OpenAI 回退，需要此 key |

---

## 备案进度

| 域名 | 状态 | 说明 |
|------|------|------|
| shengjingjc.cn | ⏳ 备案中 | 约1周，通过后才能备案 geo.cn.mt |
| geo.cn.mt | ❌ 待备案 | 备案完成后：DNSHE 改指向 ECS → HTTPS → 切回生产 |

---

## 推荐下一步

1. **填入 `DEEPSEEK_API_KEY`** → 本地验证监测能跑通
2. **等 `shengjingjc.cn` 备案完成** → 然后备案 `geo.cn.mt`
3. **`geo.cn.mt` 备案完成后**：DNSHE 改指向 ECS → HTTPS certbot → 切回 ECS 生产
4. 或继续走 **Vercel 部署路径**（需 vercel login + 补全环境变量）

---

## 关键文件索引

| 文件 | 用途 |
|------|------|
| `src/lib/monitoring/deepseek-provider.ts` | DeepSeek provider 实现 |
| `src/lib/monitoring/config.ts` | Provider 切换 + createProvider 工厂 |
| `src/components/sidebar-nav.tsx` | 客户端侧边栏导航（active state） |
| `src/components/trend-chart.tsx` | SVG 趋势图表 |
| `src/components/run-now-button.tsx` | Run Now 按钮（实时反馈） |
| `src/app/api/report/export/route.ts` | Markdown 报告导出 API |
| `prisma/schema.prisma` | 数据库模型 |
| `vercel.json` | Cron 配置 |
