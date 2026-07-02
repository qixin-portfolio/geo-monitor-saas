import { describe, expect, it } from "vitest"

import {
  buildRepairTaskWorkbenchViewModel,
  deriveRepairTaskRiskLevel,
  deriveRepairTaskType,
  getRepairTaskEvidenceSummary,
  getRepairTaskRiskReason,
} from "./repair-task-workbench"

describe("repair task workbench view model", () => {
  it("derives FAQ from repair task metadata", () => {
    const task = {
      type: "LOCAL_SERVICE_PAGE",
      evidenceJson: {
        repairTask: {
          taskType: "faq_addition",
          evidenceGap: "weak_brand_definition",
        },
      },
    }

    expect(deriveRepairTaskType(task)).toBe("FAQ")
    expect(deriveRepairTaskRiskLevel(task)).toBe("GREEN")
  })

  it("derives comparison tasks as yellow risk", () => {
    const task = {
      title: "补齐竞品对比与本地推荐证据",
      type: "COMPARISON",
      sourceReason: "需要说明竞品对比边界，不能夸大排名。",
      evidenceJson: {
        repairTask: {
          taskType: "competitor_counter",
          evidenceGap: "competitor_evidence_advantage",
        },
      },
    }

    expect(deriveRepairTaskType(task)).toBe("COMPARISON")
    expect(deriveRepairTaskRiskLevel(task)).toBe("YELLOW")
    expect(getRepairTaskRiskReason(task)).toContain("人工确认")
  })

  it("flags unsafe repair directions as red risk", () => {
    const task = {
      title: "错误修复方向示例",
      type: "ARTICLE",
      sourceReason: "伪造评价和攻击竞品都不允许进入执行。",
    }

    expect(deriveRepairTaskRiskLevel(task)).toBe("RED")
    expect(getRepairTaskRiskReason(task)).toContain("高风险")
  })

  it("keeps schema tasks green when no risky language exists", () => {
    const task = {
      type: "SCHEMA",
      sourceReason: "补充 Organization / LocalBusiness / FAQ 结构化信息。",
      evidenceJson: {
        repairTask: {
          taskType: "schema_fix",
          suggestedPage: "官网服务页",
        },
      },
    }

    expect(deriveRepairTaskType(task)).toBe("SCHEMA")
    expect(deriveRepairTaskRiskLevel(task)).toBe("GREEN")
  })

  it("extracts linked query, evidence gap, page, and next steps", () => {
    const summary = getRepairTaskEvidenceSummary({
      sourceQuery: "staging repair task button qa query A",
      evidenceJson: {
        relatedQuery: "品牌怎么被 AI 推荐",
        trigger: "missing_citable_brand_evidence",
        suggestedPage: "品牌证据页",
        nextSteps: ["补真实案例。", "补 FAQ。"],
      },
    })

    expect(summary).toEqual({
      relatedQuery: "品牌怎么被 AI 推荐",
      evidenceGap: "missing_citable_brand_evidence",
      suggestedPage: "品牌证据页",
      nextSteps: ["补真实案例。", "补 FAQ。"],
    })
  })

  it("builds a read-only workbench view model with fallback retest placeholder", () => {
    const viewModel = buildRepairTaskWorkbenchViewModel({
      title: "新增可被 AI 引用的品牌证据页",
      type: "LOCAL_SERVICE_PAGE",
      sourceQuery: "品牌 AI 可见度怎么提升",
      sourceReason: "AI 没有找到清晰品牌证据。",
      briefJson: {
        evidenceNeeded: ["真实案例", "服务说明", "FAQ"],
      },
    })

    expect(viewModel.type).toBe("SERVICE_PAGE")
    expect(viewModel.riskLevel).toBe("GREEN")
    expect(viewModel.whyFix).toContain("品牌证据")
    expect(viewModel.howToFix).toEqual(["真实案例", "服务说明", "FAQ"])
    expect(viewModel.retestPlaceholder).toContain("不自动执行复测")
  })
})
