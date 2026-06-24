# GEO Monitor SaaS — 当前状态

> 更新时间：2026-06-24 | 本轮：关键词删除 + 批量操作 + 空状态引导

---

## 一句话状态

V3 Phase 1 全部完成，本轮新增关键词删除、批量操作、新用户引导。等 `shengjingjc.cn` 备案完成后备案 `geo.cn.mt`，再切回 ECS。

---

## 最新验证

| 项目 | 状态 | 说明 |
|------|------|------|
| `npm test` (11 tests, 8 files) | ✅ 全部通过 | Vitest, 含 unit + integration |
| `npm run build` | ✅ 通过 | 18 个路由 |
| Git 工作树 | ✅ 干净 | 分支 codex/geo-monitor-v3-phase-1, commit a808e9c |
| ECS HTTP 80 | ✅ 200 OK | Nginx → Next.js standalone |
| ECS Postgres | ✅ 连通 | PrismaPg driver adapter 正常工作 |

---

## 已完成（本轮新增）

### 关键词删除功能

- `DELETE /api/queries/[queryId]` — 级联删除 QueryRun + Response + Query
- `query-manager.tsx` 每个关键词卡片右上角新增垃圾桶图标按钮
- 删除前弹出 `window.confirm` 确认，防止误操作
- 删除后自动从本地 state 移除，无需刷新页面

### 批量操作

- 新增批量操作工具栏（关键词列表上方）
- **全选/取消全选**活跃关键词（`CheckSquare`/`Square` 图标）
- 每个活跃关键词左侧显示勾选框，可单独勾选
- 已选中时显示「批量启用」「批量暂停」「批量删除」按钮
- 批量删除前弹出确认对话框，显示删除数量

### 新用户引导空状态

- 关键词为空时不再显示「还没有关键词」的简单文案
- 新增 `EmptyState` 组件，带 Zap 图标 + 3 步引导：
  1. 填写品牌信息
  2. 添加监测关键词
  3. 系统自动跑监测

### 其他改进

- 添加关键词输入框支持 Enter 快捷键提交
- API 路由移除重复的 PATCH handler

---

## 已完成（V3 Phase 1 + DeepSeek + UI/UX）

- 自动化监测服务层（provider 抽象 → 单查询执行 → 租户批处理 → 全租户调度）
- Insight snapshot 构建 + 异常提示计算
- 持久化模型：RunBatch, QueryRun, InsightSnapshot, AnomalyFlag
- Vercel Cron 入口 + 手动触发接口
- Dashboard 数据：推荐率、平均排名、竞品、异常提示、最新运行状态
- DeepSeek provider 支持（`MONITORING_PROVIDER=deepseek`）
- 状态徽章颜色编码、AnomalyBanner、RunNowButton 实时反馈
- 侧边栏导航、趋势图表、Markdown 导出报告

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

1. **等 `shengjingjc.cn` 备案完成** → 然后备案 `geo.cn.mt`
2. **`geo.cn.mt` 备案完成后**：DNSHE 改指向 ECS → HTTPS certbot → 切回 ECS 生产
3. 或继续走 **Vercel 部署路径**（需 vercel login + 补全环境变量）
4. 考虑下一步功能：CSV 导入关键词、关键词排序、移动端响应式优化

---

## 关键文件索引

| 文件 | 用途 |
|------|------|
| `src/components/query-manager.tsx` | 关键词管理（删除 + 批量 + 空状态引导） |
| `src/app/api/queries/[queryId]/route.ts` | PATCH toggle + DELETE 级联删除 |
| `src/lib/monitoring/deepseek-provider.ts` | DeepSeek provider 实现 |
| `src/lib/monitoring/config.ts` | Provider 切换 + createProvider 工厂 |
| `src/components/sidebar-nav.tsx` | 客户端侧边栏导航 |
| `src/components/trend-chart.tsx` | SVG 趋势图表 |
| `src/components/run-now-button.tsx` | Run Now 按钮 |
| `src/app/api/report/export/route.ts` | Markdown 报告导出 API |
| `prisma/schema.prisma` | 数据库模型 |
| `vercel.json` | Cron 配置 |
