# RepairTask Button Browser QA Record

> 本文记录 Evidence Detail Drawer 单条“加入修复任务池”按钮在本地非生产环境中的浏览器级 QA。
> 本轮不新增 public API route、不新增新的写库路径、不修改 schema、不生成 migration。

## 1. QA 环境说明

| 项目 | 记录 |
|------|------|
| QA 状态 | 已执行 |
| QA 结论 | 15 条用例通过，0 失败，0 blocked |
| 是否为非生产环境 | 是，本地 `localhost:5432` 测试库 `geo_monitor` |
| 本地访问地址 | `http://localhost:3001` |
| 测试 tenant | `manual_qa_tenant_a_local` / `manual_qa_tenant_b_local` |
| 测试 Query / QueryRun / Analysis | 使用本地 fake seed 数据 |
| 是否使用真实客户数据 | 否 |
| 是否使用真实 raw AI response | 否 |
| 是否使用真实手机号、微信号、邮箱、token、cookie | 否 |
| 是否提交 seed / payload / env | 否 |

执行前确认：

- `.env.local` 被 `.gitignore` 忽略。
- `DATABASE_URL` host 为 `localhost`，未打印完整 URL。
- `pnpm prisma migrate deploy` 和 `pnpm prisma generate` 已在本地测试库完成。
- PR #19 已合并到 main，按钮已接入 Evidence Detail Drawer。
- PR #18 server action 级 Manual QA 结果为 15 pass / 0 fail / 0 blocked。

本地环境限制：

- `src/proxy.ts` 在 `NODE_ENV=development` 下会绕过 Clerk route protection。
- dashboard 侧栏在 development 下显示固定 `D`，不展示 Clerk `UserButton`。
- 本轮浏览器 QA 使用 fake DB 数据和 `getOrCreateTenant()` 的 dev fallback 模拟 Tenant A / Tenant B 切换。
- 因此，本轮覆盖本地按钮点击链路、server action 写库链路和 tenant 数据隔离，但不等同于 staging 环境中的真实 Clerk 登录 / 退出 / 账号切换 QA。

## 2. 浏览器 QA 用例表格

| # | 用例名称 | 输入条件 | 预期结果 | 实际结果 | 状态 | 备注 |
|---|----------|----------|----------|----------|------|------|
| 1 | Drawer 可打开 | Tenant A Evidence Map 页面，点击“查看详情” | 详情抽屉打开 | 抽屉正常打开，展示 Query 基本信息、来源判断、Evidence Gap、RepairTask Draft 和 Confidence Label | 通过 | 使用 fake Tenant A 数据 |
| 2 | 能看到 RepairTask Draft | 打开 Tenant A 详情抽屉 | 展示 RepairTask Draft 区域 | 可见“持续维护当前证据页面”、nextSteps 和“加入修复任务池”按钮 | 通过 | 数据为本地 fake draft |
| 3 | 无按钮直接写库行为 | 只打开 Evidence Map 和 Drawer，不点击确认 | 不新增 `GeoContentTask` | 打开页面和抽屉后 Tenant A 任务数仍为 0 | 通过 | 执行前清理 fake Tenant A / B 旧任务 |
| 4 | 点击按钮后先出现确认弹窗 | 点击“加入修复任务池” | 先出现确认弹窗，不直接写库 | 出现确认弹窗，文案包含系统推断和“并非第三方平台确认的来源结论” | 通过 | 确认前未新增任务 |
| 5 | 点击取消后不创建任务 | 在确认弹窗点击“取消” | 弹窗关闭，不写库 | 弹窗关闭，Tenant A 任务数仍为 0 | 通过 | 覆盖用户取消路径 |
| 6 | 点击确认后创建成功 | 在确认弹窗点击“确认加入” | 创建单条任务并显示成功提示 | 显示“已加入修复任务池。”，按钮显示“已加入”，Tenant A 任务数为 1 | 通过 | 复用 `createEvidenceRepairTask` |
| 7 | 成功后显示成功状态 | 创建成功后保持抽屉打开 | 显示成功文案，不显示原始返回内容 | 可见“已加入修复任务池。”，未展示 stack / DB 错误 | 通过 | 安全提示通过 |
| 8 | 重复创建返回 duplicate | 刷新页面后对同一 draft 再次确认 | 返回 duplicate，不重复创建 | 显示“该修复任务已存在，未重复创建。”，按钮显示“已存在”，Tenant A 任务数仍为 1 | 通过 | 幂等仍不是 DB unique constraint |
| 9 | duplicate 显示安全提示 | duplicate 返回后查看 UI | 显示友好 duplicate 文案 | 未展示 raw server error / stack / Prisma 错误 | 通过 | 只展示安全映射文案 |
| 10 | 低置信 / 数据不足仍提示系统推断 | 当前 fake run 缺少历史 run | 页面提醒数据不足和系统推断 | 页面显示“数据不足”“中置信推断”和“系统推断，不代表第三方平台确认的来源结论” | 通过 | 低置信场景仍允许人工确认 |
| 11 | 切换到另一条 query 后状态不串 | Tenant A 抽屉出现权限错误后，切到 Tenant B fake query | 不显示上一条 query 的错误 / 成功 / duplicate 状态 | Tenant B Evidence Map 和抽屉显示干净的初始按钮状态 | 通过 | 通过 dev fallback 模拟 Tenant B query |
| 12 | 错误提示不展示 raw error | 打开 Tenant A 弹窗后将 dev fallback 切到 Tenant B，再点击确认 | server action 拒绝跨 tenant 创建，UI 显示友好错误 | UI 显示“当前账号无权创建该任务。”，未展示 stack / Prisma 错误 / raw server error | 通过 | 只用 fake 数据制造权限错误 |
| 13 | Content Backlog 中能看到新任务 | 创建成功后进入 `/dashboard/content-backlog` | 当前 tenant 可见新任务 | Tenant A Content Backlog 显示“持续维护当前证据页面”任务 | 通过 | 任务状态为待办 |
| 14 | 切换 Tenant B 后看不到 Tenant A 任务 | 将 dev fallback 切到 Tenant B 后打开 Content Backlog | Tenant B 不显示 Tenant A 任务 | Tenant B Content Backlog 显示“暂无修复任务”，未出现 Tenant A 任务 | 通过 | 本地 dev fallback 模拟，需 staging 真实账号复测 |
| 15 | 任务内容不包含敏感字段 | 检查创建后的 fake task 展示字段和入库 JSON | 不包含 raw response / prompt / token / secret / cookie | 本地扫描未命中 raw response、prompt、token、secret、cookie、authorization 或 DB URL 模式 | 通过 | 只扫描 fake task 的安全摘要字段 |

## 3. QA 结论

Button Browser QA passed in local non-production environment.

本轮覆盖：

- Drawer 打开和 RepairTask Draft 展示。
- 点击按钮前不写库。
- 确认弹窗、取消、确认创建。
- success / duplicate / permission error 的安全提示。
- Content Backlog 当前 tenant 可见性。
- Tenant B 隔离显示。
- 写入任务的敏感字段扫描。

仍需注意：

- 本轮是本地 `development` 环境，Clerk route protection 被开发模式绕过。
- Tenant B 切换通过 fake DB 的 dev fallback 模拟，不是 staging 中真实 Clerk 用户切换。
- 后续进入 staging 或生产发布检查前，应使用真实测试账号完成 Clerk 登录、退出、账号切换和 tenant 隔离复测。

## 4. 安全边界确认

- 未修改 Prisma schema。
- 未生成 migration。
- 未修改 env。
- 未新增 public API route。
- 未新增新的写库路径。
- 未修改 `createEvidenceRepairTask` server action。
- 未修改 validator。
- 未提交 `.env.local`。
- 未提交 seed 脚本或 payload 文件。
- 未使用真实客户数据。
- 未做批量创建。
- 未做无人确认执行。
- 未做 Lead Attribution、PDF 或全平台接入。

## 5. 下一步判断

本地按钮级 QA 已通过 15 条用例，可以进入下一轮“小范围 staging 发布检查 / staging Clerk 账号切换复测”的 Human Gate。

下一轮仍不应直接进入批量创建、无人确认执行或生产 rollout。 staging 检查至少应补：

- 使用 Clerk 测试账号 A / B 登录和退出。
- 验证真实 Clerk session 下 Tenant A / B 的 Content Backlog 隔离。
- 验证 staging 环境没有使用 production database。
- 验证错误提示仍不泄露 raw server error。
