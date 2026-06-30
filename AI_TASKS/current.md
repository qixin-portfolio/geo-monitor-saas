# 当前任务单模板

> 本文件由 Codex 维护。每次任务开始前先读取，并在明确任务后按需更新。
> 复杂任务应优先记录到 GitHub Issue，再由 Codex 基于 Issue 开分支执行。

---

## 任务名称

Evidence Map MVP：AI 答案证据链页面

## GitHub 入口

- Issue：待填写。
- PR：待创建。

## 背景

GEO Monitor 下一阶段从“AI 提及率监测工具”升级为“AI 答案证据链与页面修复建议系统”。
本轮只做第一轮可验收切片：方案文档、Loop 文档、概念模型、纯函数和只读 Evidence Map 页面。

## 本次目标

1. 新增 Evidence-led GEO Monitor v1.1 产品方案文档。
2. 新增 Evidence-led GEO Loop 执行文档。
3. 新增 Evidence Chain 概念数据模型文档。
4. 新增 Evidence extraction 纯函数。
5. 新增 `/dashboard/evidence-map` 只读页面和导航入口。
6. 基于现有 Query / QueryRun / QueryRunAnalysis 派生证据链表格。

## 修改范围

- `docs/product/evidence-led-geo-monitor-v1.1.md`
- `docs/loops/evidence-led-geo-loop.md`
- `docs/architecture/evidence-chain-data-model.md`
- `src/lib/evidence/extract-evidence-map.ts`
- `src/app/dashboard/evidence-map/page.tsx`
- `src/components/sidebar-nav.tsx`
- `AI_TASKS/current.md`
- `AI_TASKS/handoff.md`

## 禁止事项

- 不提交真实 API Key / Token / 账号密码。
- 不提交 `.env`、数据库连接串、账号密码。
- 不自动合并 PR。
- 不擅自修改生产部署、数据库、认证、支付配置。
- 不使用 `git add .`、`git reset --hard`、`git clean`、force push。

## 验收标准

- [ ] 修改范围符合 Issue / 任务说明。
- [ ] 没有真实密钥或敏感信息。
- [ ] 没有无关文件变更。
- [ ] 已运行必要检查。
- [ ] PR 描述已更新。
- [ ] `AI_TASKS/handoff.md` 已更新。
- [ ] `pnpm typecheck` 通过。
- [ ] `pnpm build` 通过。
- [ ] 不修改 Prisma schema。
- [ ] 不生成 migration。
- [ ] 不运行生产迁移。

## 是否需要 Loop

- 判断：需要。
- 依据：本任务是 GEO 监测结果持续转证据链和修复建议的第一轮循环，具有重复性、可验收、有产品价值。

## 是否需要 Human Gate

- 判断：不需要额外 Human Gate。
- 原因：本轮不部署、不改生产数据库、不改认证、支付、权限或环境变量；最终合并 PR 仍由用户决定。

## 交付格式

1. 修改文件
2. 修改说明
3. 自测命令
4. 自测结果
5. 风险
6. 下一步建议
