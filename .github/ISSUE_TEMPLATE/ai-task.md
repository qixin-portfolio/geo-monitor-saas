---
name: AI Task
about: 交给 ChatGPT / Codex 协作执行的任务
title: "[AI Task] "
labels: ["ai-task"]
assignees: []
---

## 目标

请用一句话说明这次任务要达成什么。

## 背景

- 当前问题：
- 为什么现在要做：
- 相关页面 / 模块：

## 修改范围

- 允许修改：
- 禁止修改：

## 验收标准

- [ ] 修改范围符合本 Issue。
- [ ] 没有真实密钥、token、数据库连接串、账号密码。
- [ ] 没有无关文件变更。
- [ ] 必要检查已通过。
- [ ] PR 描述完整。
- [ ] `AI_TASKS/handoff.md` 已更新。

## 是否需要 Loop

- [ ] 否，单次任务。
- [ ] 是，请参考 `AI_TASKS/LOOP_PROTOCOL.md`。

如果需要 Loop，请补充：

- Trigger / 心跳：
- Goal / 目标：
- Acceptance Criteria / 验收：
- Execution Boundary / 执行边界：
- Reviewer / 检查者：
- State File / 状态文件：

## 是否需要 Human Gate

- [ ] 否。
- [ ] 是，原因：

涉及部署、数据库、支付、认证、生产环境、删除数据、批量操作时必须勾选“是”。

## 风险

- 技术风险：
- 数据风险：
- 产品风险：
- 回滚方式：

## 交付要求

Codex 完成后必须：

- 创建 PR。
- 更新 PR 描述或 PR 评论。
- 更新 `AI_TASKS/handoff.md`。
- 不自动合并 PR。
