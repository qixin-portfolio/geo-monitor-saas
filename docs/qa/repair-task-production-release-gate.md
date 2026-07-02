# RepairTask Production Release Gate

> 本 Gate 用于判断 Evidence Detail Drawer 单条“加入修复任务池”按钮是否可以从 staging 进入 production。
> 本文只定义发布前检查、最小 smoke test、禁止事项和回滚方案；不修改代码、不部署 production、不连接 production DB。

## 1. Gate 结论

PR #21 合并后，不代表可以直接 production rollout。

进入 production 前必须先完成本文 Gate 中的人工确认。Gate 通过前，不允许扩大到批量创建、无人确认执行、全租户开放或真实客户大范围开放。

当前允许状态：

- 可以将本 Gate 文档合并到 main。
- 可以由人工决定是否安排小范围 production smoke test。
- 不可以直接进入批量或自动流程。

## 2. 当前已完成验证

| 验证项 | 结果 |
|--------|------|
| 本地 Button Browser QA | 15 pass / 0 fail / 0 blocked |
| Staging Button QA | 19 pass / 0 fail / 0 blocked |
| Staging 登录环境 | Clerk Staging 真实登录 |
| Staging 数据库 | Supabase `geo-monitor-staging` |
| Staging runtime 连接 | Supabase transaction pooler |
| Tenant A / B 隔离 | 通过 |
| GeoContentTask QA 前数量 | Tenant A = 0 / Tenant B = 0 |
| GeoContentTask QA 后数量 | Tenant A = 1 / Tenant B = 1 |
| duplicate / 已存在场景 | 未重复写入 |
| Content Backlog 可见性 | 对应 tenant 可看到对应任务 |
| 真实客户数据 | 未使用 |
| raw / prompt / token / secret-like 数据 | 未发现进入任务展示 |

已验证的能力边界：

- 打开 Evidence Map / Detail Drawer 不会自动创建任务。
- 点击“加入修复任务池”后必须先出现确认弹窗。
- 用户取消不创建任务。
- 用户确认后只创建单条 `GeoContentTask`。
- 用户 B 看不到用户 A 的 query / task。
- 任务进入 Content Backlog 后仍只对所属 tenant 可见。
- 页面文案使用“系统推断”等安全表述，不把结果包装成第三方平台确认结论。

## 3. Production 发布前必须确认

发布前必须由人工逐项确认，并记录确认人、时间和结论。

| 检查项 | 必须满足 |
|--------|----------|
| Production `DATABASE_URL` | 指向确认过的 production 数据库；只允许 masked host 级核对，不打印完整 URL 或密码 |
| Production Clerk app | 与 production 域名配置正确 |
| Production route protection | `/dashboard` 等受保护页面必须由 production Clerk app 拦截 |
| Production tenant resolution | 与 staging 验证过的 runtime 逻辑一致 |
| Clerk key 边界 | Production 不使用 Clerk Staging key |
| Supabase 边界 | Production 不使用 Supabase `geo-monitor-staging` |
| Vercel env 边界 | Production env 中不存在 branch-specific staging 误用 |
| 数据库变量边界 | Production 没有指向 Neon / staging / 测试库的混乱变量 |
| 只读 smoke test | release 前完成 production 只读 smoke test，不写库 |
| 发布窗口 | 明确发布时间、观察人和停止条件 |
| 回滚方案 | 明确回滚部署 / 隐藏入口 / 关闭按钮路径 |

只读 smoke test 示例：

- 打开 production 域名。
- 使用内部测试账号登录。
- 只读打开 `/dashboard`、`/dashboard/evidence-map`、`/dashboard/content-backlog`。
- 核对当前账号所属 tenant 是否正确。
- 不点击“确认加入”。
- 不创建 `GeoContentTask`。
- 不运行 destructive SQL。
- 不打印 production `DATABASE_URL`、Clerk Secret、token、cookie 或密码。

## 4. Production 发布最小 smoke test

Production release 后只允许小范围验证。验证对象必须是内部测试账号和内部测试 tenant。

最小 smoke test：

1. 登录一个内部测试账号。
2. 打开 `/dashboard/evidence-map`。
3. 确认能看到该账号所属 tenant 的数据。
4. 打开 Evidence Detail Drawer。
5. 确认打开页面和 Drawer 不会自动创建任务。
6. 点击“加入修复任务池”前，必须先出现确认弹窗。
7. 只在一个内部测试 tenant 上创建 1 条任务。
8. 验证 Content Backlog 可见该任务。
9. 验证不会串 tenant。
10. 验证任务内容不包含 raw AI response、prompt、token、cookie、secret 或其他 secret-like 数据。

通过标准：

- 只创建 1 条任务。
- 没有跨 tenant 泄露。
- 没有 raw / secret-like 数据进入任务。
- 没有 raw stack、Prisma error、完整 DB 错误展示给用户。
- 没有批量创建或自动执行行为。

失败停止条件：

- 任何 tenant 隔离异常。
- 任何自动创建任务。
- 任何确认弹窗绕过。
- 任何 raw / secret-like 数据进入任务。
- 任何 production env 指向 staging / Neon / 测试库的迹象。
- 任何无法解释的写库数量增加。

## 5. Production 禁止事项

在 Gate 通过前禁止：

- 批量创建。
- 无人确认执行。
- 全租户开放。
- 对真实客户大范围开放。
- 新增写库路径。
- 新增公开 API。
- production 库 reset。
- production 库 `prisma db push`。
- production 库 `prisma migrate dev`。
- production 库 `prisma migrate reset`。
- 绕过确认弹窗。
- 把系统推断描述成第三方平台确认结论。
- 宣称按钮会自动修复、确定提升排名或 100% 保证 AI 推荐。

## 6. 回滚方案

如果 production 发现问题，优先按以下顺序处理：

1. 通过隐藏入口、关闭按钮或回滚部署停止继续创建。
2. 不删除生产数据。
3. 不直接改 production 数据库。
4. 先记录问题现象、账号、tenant、时间、任务 ID 和复现路径。
5. 开修复 PR，由审查通过后再处理。
6. 如涉及错误任务，优先人工标记或归档，不做破坏性删除。

回滚时不得：

- 执行 destructive SQL。
- reset production 数据库。
- 用 `db push` 或 `migrate dev` 修 production。
- 批量删除任务。
- 在没有审查的情况下直接改 server action 或 UI。

## 7. 下一步建议

本 Gate 文档合并后，下一步仍是 Human Gate：

- 先人工审查并合并 Production Release Gate 文档。
- 再由人工决定是否安排小范围 production smoke test。
- production smoke test 前再次确认 Production Clerk、Production DB 和 Vercel Production env 边界。
- 不进入批量创建。
- 不进入无人确认执行。
- 不进入 Lead Attribution、PDF 或全平台接入。
