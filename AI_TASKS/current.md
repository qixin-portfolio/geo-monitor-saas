# 当前任务单

> 本文件由 Codex 维护。每次任务开始前先读取，并在明确任务后按需更新。
> 复杂任务应优先记录到 GitHub Issue，再由 Codex 基于 Issue 开分支执行。

---

## 任务名称

RepairTask Detail 页面信息分区优化 v0.1.1 / Stage 2.1

## GitHub 入口

- 分支：`codex/repair-task-detail-sections-v0.1`
- PR：[https://github.com/qixin-portfolio/geo-monitor-saas/pull/26](https://github.com/qixin-portfolio/geo-monitor-saas/pull/26)
- 基线：远端 `main`
- 当前 main：`aede76589499b2f4e206399a045b0dee711f076e`
- 依赖状态：PR #21 / #22 / #23 / #24 / #25 均已合并。

## 背景

阶段 2「证据化修复工作台 v0.1」已完成：

- RepairTask 单条“加入修复任务池”按钮链路工程阶段已完成。
- 当前能力边界：单条、用户确认、可追踪。
- RepairTask 工作台已能展示 type / risk / evidence basis。
- tenant-scoped detail query 已修复。
- 非生产 Browser QA 已通过。
- PR #25 已合并。

## 本轮目标

把 RepairTask Detail 页面从“能显示”升级为“能指导执行”，让运营和老板快速理解：

1. 这条任务为什么要修。
2. 它缺什么证据。
3. 建议怎么修。
4. 风险等级是什么。
5. 修完后怎么复测 / 验收。

## 修改范围

- `src/app/dashboard/content-backlog/[id]/page.tsx`
- `src/lib/content-backlog/repair-task-workbench.ts`
- `src/lib/content-backlog/repair-task-workbench.test.ts`
- `docs/product/repair-task-workbench-v0.1.md`
- `AI_TASKS/current.md`
- `AI_TASKS/handoff.md`

## 实现计划

- [x] 保持详情页 `GeoContentTask` 查询使用 `id + tenantId`。
- [x] 保持 `queryRun` 查询通过 `query.tenantId` 限制当前 tenant。
- [x] 保持 `queryRunAnalysis` 查询通过 `queryRun.query.tenantId` 限制当前 tenant。
- [x] 新增 / 优化纯函数 ViewModel：detail summary、evidence basis、recommended action、risk handling、retest placeholder。
- [x] 详情页拆成 5 个区块：任务概览、证据依据、建议动作、风险审核、复测与报告占位。
- [x] 补充纯函数单元测试。
- [x] 更新产品文档 v0.1.1 / Stage 2.1。
- [x] 更新 AI_TASKS 状态。
- [x] 运行 `pnpm test:unit`：20 个文件 / 105 个测试通过。
- [x] 运行 `pnpm typecheck`：通过。
- [x] 运行 `pnpm build`：通过。
- [x] 运行 `git diff --check`：通过。
- [x] 完成本地非生产 Browser QA：Local env，非 production，GeoContentTask 数量 1 -> 1。
- [x] 创建 PR #26，等待人工审查。

## Browser QA 记录

- QA 环境：Local dev，使用本机已有 `.env.local` 注入进程，脱敏检查为 local 类型；未打印、保存或提交 secret。
- 是否连接 production：否。
- 是否点击写库按钮：否。
- `/dashboard/content-backlog`：页面正常加载，可看到当前 tenant 的 RepairTask，列表展示任务类型、风险等级、状态。
- `/dashboard/content-backlog/[id]`：详情页正常加载，5 个区块均可见。
- 详情页展示：type / risk / evidence / recommended action / retest placeholder 均可见。
- JSON / evidence：未作为 HTML 渲染，未新增 `dangerouslySetInnerHTML`。
- 不存在 task id：返回 404 / safe fallback。
- 跨 tenant URL 测试：本地 dev fallback 只有一个可用 tenant session，本轮未执行；tenant-scoped 查询已由代码复核和 PR #25 修复保持。
- GeoContentTask 数量：QA 前 1，QA 后 1，未新增任务。

## 禁止事项

- 不改 schema。
- 不新增 migration。
- 不改 env。
- 不新增 public API route。
- 不新增写库路径。
- 不改 `createEvidenceRepairTask`。
- 不改 `getClerkTenant` / tenant resolution。
- 不做 production deploy。
- 不连接 production DB。
- 不使用真实客户数据。
- 不做批量创建。
- 不做无人执行。
- 不做 Lead Attribution。
- 不做 PDF。
- 不新增自动发布能力。
- 不跳过 Human Gate。
- 不提交 `.env.local`、seed、payload 或临时 runner。

## 当前产品能力边界

本轮只优化 RepairTask Detail 的只读展示和纯函数 ViewModel：

- 风险审核只是展示，不新增审核写库。
- Retest / Report 只是占位，不新增 retest 写库，不生成 PDF。
- 页面保留既有简报 / 草稿入口，但不新增写库入口，不自动触发。
- production rollout、批量创建、无人执行、全租户开放仍禁止。

## 是否需要 Human Gate

- 判断：需要。
- 原因：本轮修改用户可见详情页信息架构，PR 合并前需要人工审查；不允许自动合并。

## 交付格式

1. 当前 main commit
2. PR 链接
3. 当前 head commit
4. 修改文件
5. 自测命令与结果
6. Browser QA 结果
7. 是否保持 tenant-scoped detail query
8. 是否有 schema / migration / env / 写库路径改动
9. 风险
10. 下一步建议
