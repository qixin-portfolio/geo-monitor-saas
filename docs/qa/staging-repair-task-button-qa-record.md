# Staging RepairTask Button QA Record

> 本文记录 Evidence Detail Drawer 单条“加入修复任务池”按钮在 staging Preview + Clerk Staging 真实登录环境下的按钮级 QA。
> 本轮不修改 schema / migration / env / src，不新增 public API route，不新增新的写库路径，不进入批量创建或无人确认执行。

## 1. QA 环境说明

| 项目 | 记录 |
|------|------|
| QA 状态 | 已执行 |
| QA 时间 | 2026-07-02，Asia/Shanghai |
| QA 结论 | 19 条用例通过，0 失败，0 blocked |
| Preview URL 域名 | `geo-monitor-saas-git-staging-r-abeb19-qixin-portfolios-projects.vercel.app` |
| Preview 分支 | `staging/repair-task-button-qa` |
| Preview commit | `91c8db392239400ca0f19964bad8d4a3eb145a26` |
| 数据库 | Supabase `geo-monitor-staging`，非生产 |
| runtime 数据库连接 | Supabase transaction pooler，host masked 为 `aws-1-ap-northeast-1.pooler.supabase.com`，port `6543` |
| Clerk 应用 | GEO Monitor Staging |
| 测试账号 | `qa-a+clerk_test@example.com` / `qa-b+clerk_test@example.com` |
| 测试 tenant | `staging_qa_tenant_a` / `staging_qa_tenant_b` |
| 测试 Query / QueryRun / Analysis | staging fake 数据，各 tenant 1 组 |
| 是否使用真实客户数据 | 否，0 |
| 是否记录密码、token、cookie 或 secret | 否 |
| 是否修改 Production | 否 |

前置状态：

- PR #18 server action Manual QA：15 pass / 0 fail / 0 blocked。
- PR #19 已合并到 main，Evidence Detail Drawer 已接入单条按钮。
- PR #20 已合并到 main，本地 Button Browser QA：15 pass / 0 fail / 0 blocked。
- staging migration 已执行成功，staging fake seed 已准备完成。
- Clerk 测试用户 A / B 已绑定到 `staging_qa_tenant_a` / `staging_qa_tenant_b`。

连接修复背景：

- staging Preview 初始使用 Supabase session pooler 时出现 `EMAXCONNSESSION` 连接数耗尽。
- branch-specific Preview `DATABASE_URL` 切换到 Supabase transaction pooler 后，Dashboard、Evidence Map 和 Content Backlog 页面稳定加载。
- 本轮未观察到 PgBouncer / prepared statement / Prisma 连接错误。

## 2. GeoContentTask 计数

| 阶段 | Tenant A | Tenant B | 说明 |
|------|----------|----------|------|
| QA 前 | 0 | 0 | staging fake seed 完成后确认 |
| A 创建后 | 1 | 0 | 用户 A 确认加入后创建单条任务 |
| B 创建后 | 1 | 1 | 用户 B 确认加入后创建单条任务 |
| 最终 DB 只读验证 | 1 | 1 | Supabase SQL Editor 只读 count 查询确认 |

只读验证 SQL：

```sql
select t.id as tenant_id, count(g.id) as task_count
from "Tenant" t
left join "GeoContentTask" g on g."tenantId" = t.id
where t.id in ('staging_qa_tenant_a', 'staging_qa_tenant_b')
group by t.id
order by t.id;
```

最终结果：

- `staging_qa_tenant_a`: 1
- `staging_qa_tenant_b`: 1

## 3. Staging QA 用例表格

| # | 用例名称 | 输入条件 | 预期结果 | 实际结果 | 状态 | 备注 |
|---|----------|----------|----------|----------|------|------|
| A | 未登录访问受保护页面 | 未登录状态访问 staging Preview `/dashboard` | 被 Clerk route protection 拦截到登录页 | 访问 dashboard 被引导到 Clerk Staging 登录 | 通过 | 验证真实 route protection，不是 localhost dev fallback |
| B | 用户 A 登录 | 使用 `qa-a+clerk_test@example.com` 登录 | 登录成功进入 dashboard | 登录成功，Dashboard 显示 `Staging QA Tenant A` | 通过 | 未记录密码 / token / cookie |
| C | 用户 A 只能看到 Tenant A query | 用户 A 打开 `/dashboard/evidence-map` | 可见 Tenant A 测试 query | 可见 `staging repair task button qa query A` | 通过 | 页面显示 Tenant A 品牌与企业空间 |
| D | 用户 A 打开 Evidence Detail Drawer | 点击 Tenant A query 的“查看详情” | Drawer 正常打开 | 详情抽屉打开，展示 Query 基本信息、来源判断、Evidence Gap 等内容 | 通过 | 无页面崩溃 |
| E | 用户 A 可见 RepairTask Draft | Drawer 打开后查看 RepairTask Draft 区域 | 展示 draft 和单条按钮 | 可见 RepairTask Draft、“加入修复任务池”按钮和系统推断说明 | 通过 | 文案未绝对化 |
| F | 打开页面 / Drawer 不自动创建 | 用户 A 只打开页面和 Drawer，不点击按钮 | `GeoContentTask` 不增加 | A 创建前 Content Backlog 显示暂无修复任务；初始 DB 计数 A=0 / B=0 | 通过 | 无自动写库行为 |
| G | 点击按钮后先出现确认弹窗 | 用户 A 点击“加入修复任务池” | 先出现确认弹窗，不直接写库 | 出现“加入修复任务池”确认弹窗 | 通过 | 弹窗文案包含系统推断和“并非第三方平台确认” |
| H | 点击取消后不创建 | 用户 A 在确认弹窗点击“取消” | 弹窗关闭，不创建任务 | 弹窗关闭，未显示成功状态；后续确认创建前仍无任务 | 通过 | 覆盖取消路径 |
| I | 用户 A 确认后创建 1 条任务 | 用户 A 再次点击按钮并点击“确认加入” | 只创建单条 `GeoContentTask` | 显示“已加入修复任务池。”，A 最终 DB 计数为 1 | 通过 | 复用 `createEvidenceRepairTask` |
| J | 成功状态安全显示 | 用户 A 创建成功后查看 Drawer | 显示已加入或等价成功状态 | 按钮显示“已加入”，说明显示“已加入修复任务池。” | 通过 | 未展示 raw server response / stack |
| K | 同一任务不重复创建 | 用户 A 对同一 draft 再次检查 | 不重复创建；显示 duplicate / 已存在类提示 | 页面保持“已加入”禁用状态，无法重复点击；DB 计数保持 A=1 | 通过 | 本轮未出现 duplicate toast，而是以已加入状态阻止重复创建 |
| L | 用户 A Content Backlog 可见任务 | 用户 A 打开 `/dashboard/content-backlog` | 可看到用户 A 创建的任务 | Content Backlog 显示 Tenant A 的“持续维护当前证据页面”任务 | 通过 | 任务状态为待办 |
| M | 任务内容不含 raw / secret-like 数据 | 检查 Content Backlog 任务展示内容 | 不包含 raw AI response、prompt、token、cookie、secret、真实客户数据 | 页面仅展示安全摘要字段：标题、目标词、建议类型、原因、状态、创建时间 | 通过 | 未发现真实客户数据或 secret-like 字段 |
| N | 登出 A 并登录 B | 用户 A 登出后使用 `qa-b+clerk_test@example.com` 登录 | B 登录成功 | B 登录成功，Dashboard 显示 `Staging QA Tenant B` | 通过 | 真实 Clerk Staging 账号切换 |
| O | 用户 B 看不到 Tenant A 数据 | 用户 B 打开 Evidence Map / Content Backlog | 不显示 Tenant A query / task | B 页面显示 Tenant B 品牌与企业空间；未出现 A query 或 A task | 通过 | 未发现 tenant 泄露 |
| P | 用户 B 可见 Tenant B query | 用户 B 打开 `/dashboard/evidence-map` | 可见 Tenant B 测试 query | 可见 `staging repair task button qa query B` | 通过 | 页面标题显示 Tenant B |
| Q | 用户 B 对 Tenant B 创建单条任务 | 用户 B 打开 Drawer，点击按钮并确认 | 只创建 Tenant B 的单条任务 | 确认弹窗先出现；确认后显示“已加入修复任务池。”，按钮显示“已加入” | 通过 | B Content Backlog 可见 B 任务 |
| R | DB 验证 A/B 数量和隔离 | 执行 Supabase SQL Editor 只读 count 查询 | A=1，B=1，不串租户 | 最终结果 `staging_qa_tenant_a=1`，`staging_qa_tenant_b=1` | 通过 | 只读 SQL，未执行 destructive SQL |
| S | 确认未触碰 production / Neon | 回顾本轮环境与操作 | 未连接 production / Neon，未修改 Production env | Preview 使用 staging branch-specific env；Production 未修改；未使用 Neon；未部署 production | 通过 | 本轮只使用 staging Preview 和 Supabase staging |

## 4. QA 结论

Staging RepairTask Button QA passed in staging non-production environment.

最终统计：

- 19 pass
- 0 fail
- 0 blocked

本轮确认：

- 真实 Clerk Staging route protection 生效。
- Clerk 测试用户 A / B 可真实登录、登出、切换。
- Tenant A / B 的 Evidence Map 和 Content Backlog 未串租户。
- 打开页面和 Drawer 不会自动创建任务。
- 单条按钮必须经过确认弹窗后才写库。
- 用户取消不创建任务。
- 用户确认后每个 tenant 只创建 1 条 `GeoContentTask`。
- UI 不展示 raw stack、Prisma 错误或 raw API response。
- 任务展示内容未发现 raw AI response、prompt、token、cookie、secret 或真实客户数据。

## 5. 安全边界确认

- 未修改 Prisma schema。
- 未生成 migration。
- 未修改 env。
- 未修改 `src`。
- 未修改 server action。
- 未修改 UI。
- 未新增 public API route。
- 未新增新的写库路径。
- 未提交 `.env.local`。
- 未提交 seed 脚本。
- 未提交 payload 文件。
- 未提交临时 runner。
- 未使用真实客户数据。
- 未打印完整 `DATABASE_URL`。
- 未打印 Clerk Secret、token、cookie、密码。
- 未做批量创建。
- 未做无人确认执行。
- 未做 Lead Attribution。
- 未做 PDF。
- 未做全平台接入。
- 未部署 production。

## 6. 下一步建议

PR 合并后，下一步仍应走 Human Gate。

允许考虑：

- 小范围 staging 观察 / 回归检查。
- 进一步补按钮级端到端测试或日志观察。

不应直接进入：

- 批量创建。
- 无人确认执行。
- 生产 rollout。
- Lead Attribution。
- PDF 导出。
- 全平台接入。
