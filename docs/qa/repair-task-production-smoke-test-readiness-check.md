# RepairTask Production Smoke Test Readiness Check

> 本文档不是 production smoke test。
> 本文档不是 production rollout。
> 本文档只是 production smoke test 前的人工准备清单，用于判断是否具备安排小范围 production smoke test 的条件。

## 1. 当前已完成验证

| 验证项 | 结果 |
|--------|------|
| Local Browser QA | 15 pass / 0 fail / 0 blocked |
| Staging Button QA | 19 pass / 0 fail / 0 blocked |
| Staging 登录环境 | Clerk Staging 真实登录 |
| Staging 数据库 | Supabase `geo-monitor-staging` |
| Staging runtime 连接 | Supabase transaction pooler |
| Tenant A / B 隔离 | 通过 |
| GeoContentTask QA 前数量 | Tenant A = 0 / Tenant B = 0 |
| GeoContentTask QA 后数量 | Tenant A = 1 / Tenant B = 1 |
| duplicate / 已存在场景 | 未重复写入 |
| Content Backlog 可见性 | 对应 tenant 可看到对应任务 |
| Production Release Gate | 已合并 |
| 真实客户数据 | 未使用 |

已验证的能力边界：

- 单条“加入修复任务池”按钮必须由用户主动点击。
- 打开 Evidence Map 或 Evidence Detail Drawer 不会自动创建任务。
- 点击按钮后必须先出现确认弹窗。
- 只有用户确认后才创建单条 `GeoContentTask`。
- Staging Tenant A / B 隔离已通过验证。

## 2. Readiness Check 目标

本轮只确认是否具备安排小范围 production smoke test 的条件。

本轮不是：

- 不部署。
- 不写 production DB。
- 不点击生产按钮。
- 不改 env。
- 不把功能开放给全租户。

## 3. Production 环境人工核对清单

任何 production smoke test 被安排前，必须由人工逐项确认。

| 核对项 | 必须确认 |
|--------|----------|
| Vercel 项目 | Production Vercel 项目仍是 `geo-monitor-saas` |
| Production 域名 | Production 域名仍是 `geoup.online` |
| Production `DATABASE_URL` | 指向明确的生产数据库 |
| Staging DB 边界 | Production `DATABASE_URL` 不是 Supabase `geo-monitor-staging` |
| Preview env 边界 | Production `DATABASE_URL` 不是 branch-specific Preview env |
| Clerk production app | Production Clerk app 是生产应用，不是 `GEO Monitor Staging` |
| Clerk key 边界 | Production Clerk publishable key / secret key 与生产域名匹配 |
| Route protection | Production route protection 已配置 |
| Tenant resolution | Production 使用与 staging 一致的 `getClerkTenant` 逻辑 |
| Staging 测试用户边界 | Production 不使用 `qa-a+clerk_test@example.com` 或 `qa-b+clerk_test@example.com` |
| Staging 测试 tenant 边界 | Production 不使用 `staging_qa_tenant_a` 或 `staging_qa_tenant_b` |
| Supabase staging 边界 | Production 没有误用 Supabase `geo-monitor-staging` |
| Preview branch env 边界 | Production 没有误用 Preview branch-specific env |
| 发布窗口 | Production smoke test 发布窗口已确认 |
| 回滚方式 | 回滚方式已确认 |

## 4. Production Smoke Test 前必须准备

执行任何 production smoke test 前，必须准备并记录：

- 一个内部测试账号。
- 一个内部测试 tenant。
- 该 tenant 必须有测试 Query / QueryRun / Analysis。
- 确认该 tenant 不是真实客户 tenant。
- 确认 smoke test 只允许创建 1 条 `GeoContentTask`。
- 确认测试前记录 `GeoContentTask` 数量。
- 确认测试后记录 `GeoContentTask` 数量。
- 确认测试任务可人工归档或标记。
- 确认不删除生产数据。

## 5. Production Smoke Test 允许动作

如果 Readiness Check 通过，未来 production smoke test 最多允许：

- 内部账号登录 production。
- 打开 `/dashboard/evidence-map`。
- 打开 Evidence Detail Drawer。
- 确认不会自动创建任务。
- 点击按钮后必须出现确认弹窗。
- 在内部测试 tenant 上确认创建 1 条任务。
- 打开 Content Backlog 查看任务。
- 核对没有 raw response / token / secret-like 数据进入任务。
- 核对没有串 tenant。

## 6. Production Smoke Test 禁止动作

禁止：

- 全租户开放。
- 真实客户大范围测试。
- 批量创建。
- 无人确认执行。
- 跳过确认弹窗。
- 新增写库路径。
- 新增 public API。
- 生产库 reset。
- 生产库 `prisma db push`。
- 生产库 `prisma migrate dev`。
- 删除生产数据。
- 把系统推断说成第三方平台确认结论。
- 使用“自动修复”“平台官方归因”等误导表达。

## 7. Go / No-Go 判定

Readiness Check 通过条件：

- 所有环境指向清楚。
- 内部测试账号 / tenant 已准备。
- 发布窗口明确。
- 回滚方案明确。
- 没有 env 混乱。
- 没有 production / staging 混用。
- Human Gate 人工确认。

Readiness Check 不通过条件：

- Production DB 指向不清楚。
- Clerk production / staging 混用。
- 没有内部测试 tenant。
- 无法确认 tenant isolation。
- 没有回滚方案。
- 任何人要求跳过确认或直接全量开放。

## 8. 下一步

本 PR 合并后，只表示 readiness 文档准备完成。

下一步：

- 仍需人工决定是否执行 Production Smoke Test。
- 不能自动进入 production rollout。
- 不能进入批量或自动化。
- 不能进入 Lead Attribution、PDF 或全平台接入。
