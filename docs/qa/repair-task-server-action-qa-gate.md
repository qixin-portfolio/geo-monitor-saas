# RepairTask Server Action QA Gate

> 本文是接入前端“加入修复任务池”按钮前的人工 QA 闸门。
> PR #15 已新增 server 端单条 `GeoContentTask` 创建能力；本轮不新增新的写库路径。

## 1. 当前能力边界

- 已有 server 端单条 `GeoContentTask` 创建能力：`createEvidenceRepairTask`。
- 尚未接 Evidence Map / Evidence Detail Drawer UI 按钮。
- 尚未接批量创建。
- 尚未接自动修复。
- 尚未接 Lead Attribution。
- 尚未接 PDF。
- 尚未开放 public API route。
- 本轮只补 QA Gate、调用边界说明和 UI 接入前置条件。

## 2. 人工 QA 前置条件

- 必须使用非生产环境。
- 必须使用测试 tenant。
- 必须使用测试账号。
- 必须使用测试 Query / QueryRun / Analysis。
- 不使用真实客户数据。
- 不使用真实 raw AI response。
- 不使用真实手机号、微信号、邮箱、token、cookie。
- 如需构造异常 payload，仅使用脱敏 mock 字段。

## 3. QA 用例清单

| 编号 | 用例 | 期望结果 |
|------|------|----------|
| A | 未登录调用 | 拒绝创建，返回未登录或无法确认租户错误 |
| B | 无 tenant 调用 | 拒绝创建，不写入 `GeoContentTask` |
| C | 非法 priority | validator 拒绝，错误中说明 invalid priority |
| D | 非法 taskType | validator 拒绝，不写库 |
| E | payload 包含 raw response 字段 | 拒绝或确保不入库 |
| F | payload 包含 secret-like 字段 | 拒绝或确保不入库 |
| G | `queryId` 不属于当前 tenant | 拒绝创建 |
| H | `queryRunId` 不属于当前 tenant | 拒绝创建 |
| I | `analysisId` 不属于当前 tenant | 拒绝创建 |
| J | 合法 draft | 只创建单条任务 |
| K | 重复创建同一任务 | 返回 `duplicate=true`，不重复写库 |
| L | 创建后查看当前 tenant Content Backlog | 任务只出现在当前 tenant |
| M | 切换 tenant 后查看 Content Backlog | 看不到其他 tenant 的任务 |
| N | 检查任务 `description` / `sourceReason` | 不包含 raw response / prompt / token / secret |
| O | 检查 `nextSteps` | 不超长，不含敏感信息 |

## 4. UI 接入前置条件

只有以下条件全部满足后，才允许接“加入修复任务池”按钮：

- PR #15 已合并。
- 本 QA Gate 文档已合并。
- 手动 QA 通过。
- server action 不暴露 public API。
- 幂等去重策略在当前 `GeoContentTask` 字段限制下可接受。
- tenant 校验通过。
- query / run / analysis 归属校验通过。
- 仍然只允许单条创建。
- UI 必须有确认弹窗。
- UI 文案不能写“自动修复”。
- UI 必须提示“系统推断，不代表平台官方归因”。

## 5. UI 文案建议

按钮：

```text
加入修复任务池
```

确认弹窗：

```text
该任务由系统根据当前 AI 答案、来源信息和证据缺口推断生成，不代表平台官方归因。加入后你可以在 GEO 修复任务中继续编辑和确认。
```

成功提示：

```text
已加入修复任务池。
```

重复提示：

```text
该修复任务已存在，未重复创建。
```

失败提示：

```text
暂时无法创建任务，请检查当前账号权限或稍后重试。
```

## 6. 本轮不做事项

- 不接 UI 按钮。
- 不做批量创建。
- 不做自动执行修复。
- 不调用外部 API。
- 不做生产数据库迁移。
- 不做 Lead Attribution。
- 不做 PDF 导出。
- 不新增 public API route。
- 不新增新的写库路径。
