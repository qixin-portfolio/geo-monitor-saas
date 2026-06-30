# PR 交付报告

## 关联 Issue

Closes #

## 执行代理

* [ ] Codex
* [ ] WorkBuddy（已推送到本 PR 分支）
* [ ] 其他 AI Executor（请注明）

## 本次变更

*

## 修改文件

*

## 自测结果

* npm run build:
* npm run typecheck:
* npm run lint:
* 其他:

## 本地交付检查（WorkBuddy 或本地执行时填写）

* 当前工作目录是否已确认：
* 目标项目是否已确认：
* 是否误改其他项目：
* 修改文件清单是否已输出：
* 是否输出影响范围说明：
* 真实密钥是否泄露：
* 重要文件是否被误删：

## Loop / Human Gate 检查

* 是否属于 Loop 任务：
* 是否读取了状态文件：
* 是否更新了状态文件：
* 是否触发 Human Gate：
* 是否存在高风险操作：
* 是否需要用户确认后才能继续：

## Maker / Checker 声明

* Maker（AI Executor）：仅声明“已完成执行并等待审查”，不得宣布任务最终完成
* 默认 Checker：ChatGPT + 用户

## 风险说明

*

## 未做事项

*

## 给 Checker 审查重点

* 是否只改了允许范围
* 是否越界
* 是否有安全 / 部署 / 数据库 / 支付认证风险
* 是否需要补 commit
* 给 AI Executor 的最小修复要求

## 给用户的决策建议

* 可合并 / 需修改 / 暂停
