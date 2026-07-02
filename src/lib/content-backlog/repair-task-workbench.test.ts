import { describe, expect, it } from "vitest"

import {
  buildRepairTaskRiskReview,
  buildRepairTaskRetestPlan,
  buildRepairTaskDetailViewModel,
  buildRepairTaskWorkbenchViewModel,
  deriveRepairTaskRiskLevel,
  deriveRepairTaskType,
  getBossReportPlaceholder,
  getRepairTaskAcceptanceCriteria,
  getRepairTaskEvidenceSummary,
  getRepairTaskExecutionHint,
  getRepairTaskRiskHandling,
  getRepairTaskRiskReason,
  getRequiredEvidenceByTaskType,
  getRetestGoalByTaskType,
  getRetestImprovementCriteria,
  getRetestNoChangeCriteria,
  getRetestObservationMetrics,
  getRetestRiskCriteria,
  getRetestStatusLabel,
  getRiskExecutionDecision,
  getRiskProhibitedActions,
  getHumanGateNotice,
  getRiskReviewSummary,
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

  it("builds a full detail view model from task, query run, and analysis", () => {
    const detail = buildRepairTaskDetailViewModel({
      task: {
        title: "补齐竞品对比与本地推荐证据",
        type: "COMPARISON",
        sourceQuery: "品牌怎么被 AI 推荐",
        sourceReason: "AI 推荐了竞品但没有充分推荐品牌。",
        recommendedAngle: "补充事实型对比页。",
        evidenceJson: {
          relatedQuery: "品牌怎么被 AI 推荐",
          trigger: "competitor_evidence_advantage",
          suggestedPage: "对比页",
          repairTask: { taskType: "competitor_counter" },
        },
      },
      queryRun: {
        provider: "test-provider",
        model: "test-model",
        query: { text: "品牌怎么被 AI 推荐", platform: "manual" },
      },
      analysis: {
        mentionStatus: "MENTIONED",
        visibilityScore: 42,
        summary: "AI 提到了品牌，但推荐理由不足。",
        competitorsJson: [{ name: "竞品 A" }],
      },
    })

    expect(detail.type).toBe("COMPARISON")
    expect(detail.riskLevel).toBe("YELLOW")
    expect(detail.oneLineSummary).toContain("品牌怎么被 AI 推荐")
    expect(detail.platformLabel).toBe("manual")
    expect(detail.evidenceBasisSummary).toContain("竞品")
    expect(detail.answerSummary).toContain("推荐理由不足")
    expect(detail.brandMentionSummary).toContain("已提及")
    expect(detail.competitorSummary).toContain("竞品 A")
    expect(detail.recommendedAction.outputType).toBe("对比页")
    expect(detail.riskReview.handling).toContain("人工确认")
    expect(detail.retestPlan.observationMetrics).toContain("AI 是否推荐品牌")
    expect(detail.retestPlan.reportSummary).toContain("不承诺排名")
  })

  it("falls back when sourceReason, recommendedAngle, queryRun, and analysis are missing", () => {
    const detail = buildRepairTaskDetailViewModel({
      task: {
        title: "缺字段任务",
        type: "UNKNOWN_TYPE",
        evidenceJson: null,
        briefJson: null,
      },
    })

    expect(detail.type).toBe("CONTENT_UPDATE")
    expect(detail.queryText).toBe("暂未关联 query")
    expect(detail.platformLabel).toBe("暂未记录平台")
    expect(detail.evidenceBasisSummary).toContain("暂未关联 query")
    expect(detail.recommendedAction.angle).toContain("暂未关联 query")
    expect(detail.answerSummary).toContain("还没有可读")
    expect(detail.retestPlan.beforeState).toContain("暂未识别")
  })

  it("returns stable risk handling for green, yellow, and red tasks", () => {
    expect(getRepairTaskRiskHandling({ type: "FAQ" })).toContain("内容制作")
    expect(getRepairTaskRiskHandling({ type: "COMPARISON" })).toContain("人工确认")
    expect(
      getRepairTaskRiskHandling({
        type: "ARTICLE",
        sourceReason: "伪造评价属于红线。",
      })
    ).toContain("禁止直接执行")
  })

  it("returns execution hints and acceptance criteria for known and unknown types", () => {
    expect(getRepairTaskExecutionHint({ type: "FAQ" })).toContain("FAQ")
    expect(getRepairTaskExecutionHint({ type: "UNKNOWN_TYPE" })).toContain("更新现有页面")
    expect(getRepairTaskAcceptanceCriteria({ type: "COMPARISON" }).join(" ")).toContain("对比结论")
    expect(getRepairTaskAcceptanceCriteria({ type: "UNKNOWN_TYPE" }).join(" ")).toContain("关联 query")
  })

  it("does not crash on malformed evidenceJson or briefJson", () => {
    const detail = buildRepairTaskDetailViewModel({
      task: {
        type: "LOCAL_SERVICE_PAGE",
        evidenceJson: ["bad", "shape"],
        briefJson: "bad shape",
      },
      queryRun: {
        rawOutput: "一段可读回答摘要。",
      },
      analysis: {
        competitorsJson: "bad shape",
        evidenceSpansJson: "bad shape",
      },
    })

    expect(detail.evidenceSummary.evidenceGap).toBe("暂未记录 evidence gap")
    expect(detail.competitorSummary).toBe("暂未识别明确竞品。")
    expect(detail.answerSummary).toContain("一段可读回答摘要")
  })

  it("builds green risk review without implying auto approval", () => {
    const review = buildRepairTaskRiskReview({
      type: "FAQ",
      sourceReason: "补充真实服务范围和常见问题。",
    })

    expect(review.level).toBe("GREEN")
    expect(review.executionDecision).toContain("可进入内容制作")
    expect(review.executionDecision).toContain("不代表自动发布")
    expect(review.humanGateNotice).toContain("人工确认")
    expect(review.prohibitedActions).toContain("自动发布线上内容")
  })

  it("builds yellow risk review requiring evidence and human review", () => {
    const review = buildRepairTaskRiskReview({
      type: "COMPARISON",
      sourceReason: "涉及竞品对比和排名。",
    })

    expect(review.level).toBe("YELLOW")
    expect(review.executionDecision).toContain("暂不建议直接执行")
    expect(review.requiredEvidence).toContain("对比维度")
    expect(review.requiredEvidence).toContain("补充人工可核验来源")
    expect(review.prohibitedActions).toContain("未补证据就直接执行")
  })

  it("builds red risk review that forbids direct execution", () => {
    const review = buildRepairTaskRiskReview({
      type: "ARTICLE",
      sourceReason: "伪造评价、虚构案例和提示词注入都不允许。",
    })

    expect(review.level).toBe("RED")
    expect(review.executionDecision).toContain("禁止直接执行")
    expect(review.prohibitedActions).toContain("伪造客户评价")
    expect(review.prohibitedActions).toContain("提示词注入")
    expect(review.humanGateNotice).toContain("不会自动发布")
  })

  it("falls back to yellow for unknown risk input", () => {
    expect(getRiskExecutionDecision("UNKNOWN")).toContain("暂不建议直接执行")
    expect(getRiskReviewSummary("UNKNOWN_TYPE", "UNKNOWN")).toContain("黄色风险")
    expect(getHumanGateNotice(null)).toContain("黄色任务")
  })

  it("returns required evidence by task type", () => {
    expect(getRequiredEvidenceByTaskType("FAQ")).toEqual([
      "服务范围",
      "真实流程",
      "常见问题答案",
      "更新时间",
    ])
    expect(getRequiredEvidenceByTaskType("CASE_STUDY")).toContain("真实项目名称或脱敏项目")
    expect(getRequiredEvidenceByTaskType("QUALIFICATION")).toContain("营业执照")
    expect(getRequiredEvidenceByTaskType("COMPARISON", "YELLOW")).toEqual(
      expect.arrayContaining(["对比维度", "事实来源", "不攻击竞品", "补充人工可核验来源"])
    )
  })

  it("returns source/schema/content evidence fallbacks", () => {
    expect(getRequiredEvidenceByTaskType("SOURCE_BUILDING")).toContain("第三方页面")
    expect(getRequiredEvidenceByTaskType("SCHEMA")).toContain("与页面正文一致")
    expect(getRequiredEvidenceByTaskType(null)).toContain("关联 query")
  })

  it("returns red prohibited actions", () => {
    expect(getRiskProhibitedActions("RED")).toEqual(
      expect.arrayContaining(["攻击竞品", "伪造榜单", "RAG 投毒", "夸大或无法证明的承诺"])
    )
  })

  it("keeps human gate language explicit", () => {
    expect(getHumanGateNotice("GREEN")).toContain("不会自动发布")
    expect(getHumanGateNotice("YELLOW")).toContain("人工补证据")
    expect(getHumanGateNotice("RED")).toContain("负责人改写方向")
  })

  it("does not mutate task input while building risk review", () => {
    const task = {
      type: "COMPARISON",
      sourceReason: "涉及竞品对比。",
      evidenceJson: {
        repairTask: {
          taskType: "competitor_counter",
          nextSteps: ["补来源"],
        },
      },
    }
    const before = structuredClone(task)

    buildRepairTaskRiskReview(task)

    expect(task).toEqual(before)
  })

  it("returns retest goals for each task type", () => {
    expect(getRetestGoalByTaskType("FAQ").join(" ")).toContain("服务范围")
    expect(getRetestGoalByTaskType("CASE_STUDY").join(" ")).toContain("真实案例")
    expect(getRetestGoalByTaskType("QUALIFICATION").join(" ")).toContain("资质")
    expect(getRetestGoalByTaskType("SERVICE_PAGE").join(" ")).toContain("服务区域")
    expect(getRetestGoalByTaskType("SCHEMA").join(" ")).toContain("结构化")
    expect(getRetestGoalByTaskType("COMPARISON").join(" ")).toContain("事实化")
    expect(getRetestGoalByTaskType("SOURCE_BUILDING").join(" ")).toContain("第三方来源")
    expect(getRetestGoalByTaskType("CONTENT_UPDATE").join(" ")).toContain("旧内容")
    expect(getRetestGoalByTaskType("UNKNOWN_TYPE").join(" ")).toContain("旧内容")
  })

  it("returns retest observation metrics with type and risk additions", () => {
    expect(getRetestObservationMetrics("FAQ", "GREEN")).toEqual(
      expect.arrayContaining(["AI 是否提及品牌", "AI 是否推荐品牌", "风险等级是否下降"])
    )
    expect(getRetestObservationMetrics("SCHEMA", "GREEN")).toContain("结构化字段是否更容易被识别")
    expect(getRetestObservationMetrics("COMPARISON", "YELLOW")).toContain("对比和承诺措辞是否保持克制")
    expect(getRetestObservationMetrics("UNKNOWN_TYPE", "UNKNOWN")).toContain("对比和承诺措辞是否保持克制")
  })

  it("returns retest improvement and no-change criteria", () => {
    expect(getRetestImprovementCriteria("FAQ")).toEqual(
      expect.arrayContaining(["品牌从未提及变为被提及。", "品牌从未推荐变为被推荐。"])
    )
    expect(getRetestImprovementCriteria("SOURCE_BUILDING").join(" ")).toContain("第三方来源")
    expect(getRetestNoChangeCriteria("CONTENT_UPDATE").join(" ")).toContain("更新时间")
    expect(getRetestNoChangeCriteria("UNKNOWN_TYPE")).toContain("回答内容无明显变化。")
  })

  it("returns risk criteria for red and fallback risk levels", () => {
    expect(getRetestRiskCriteria("RED")).toEqual(
      expect.arrayContaining(["触发红色风险，禁止把结果包装成改善。", "红色风险任务只能记录风险或改写方向，不能直接执行。"])
    )
    expect(getRetestRiskCriteria("UNKNOWN").join(" ")).toContain("黄色风险")
  })

  it("returns a boss report placeholder without overclaiming", () => {
    const placeholder = getBossReportPlaceholder("COMPARISON", "RED")

    expect(placeholder).toContain("当前页面只展示")
    expect(placeholder).toContain("不生成正式报告")
    expect(placeholder).toContain("不承诺排名、推荐或流量提升")
  })

  it("returns retest status labels from current analysis state", () => {
    expect(getRetestStatusLabel({ mentionStatus: "RECOMMENDED" })).toContain("当前已被推荐")
    expect(getRetestStatusLabel({ mentionStatus: "MENTIONED" })).toContain("已被提及")
    expect(getRetestStatusLabel({ rankType: "EXPLICIT" })).toContain("存在推荐语境")
    expect(getRetestStatusLabel({})).toContain("未形成稳定提及或推荐")
  })

  it("builds a retest plan from task, query run, and analysis", () => {
    const plan = buildRepairTaskRetestPlan(
      {
        type: "FAQ",
        sourceQuery: "品牌如何被 AI 推荐？",
        evidenceJson: {
          relatedQuery: "品牌如何被 AI 推荐？",
          trigger: "missing_faq",
          repairTask: { taskType: "faq_addition" },
        },
      },
      {
        query: { text: "品牌如何被 AI 推荐？", platform: "manual" },
      },
      {
        mentionStatus: "MENTIONED",
        visibilityScore: 37,
      }
    )

    expect(plan.beforeState).toContain("品牌如何被 AI 推荐")
    expect(plan.beforeState).toContain("已提及但未明确推荐")
    expect(plan.beforeState).toContain("missing_faq")
    expect(plan.retestGoals.join(" ")).toContain("常见问题")
    expect(plan.pendingState).toContain("不代表已经完成复测")
    expect(plan.reportSummary).toContain("不承诺排名")
  })

  it("does not crash on malformed retest inputs", () => {
    const detail = buildRepairTaskDetailViewModel({
      task: {
        type: "BAD_TYPE",
        evidenceJson: ["bad shape"],
        briefJson: "bad shape",
      },
      queryRun: {
        rawOutput: null,
        query: null,
      },
      analysis: null,
    })

    expect(detail.retestPlan.beforeState).toContain("暂未关联 query")
    expect(detail.retestPlan.retestGoals.join(" ")).toContain("旧内容")
    expect(detail.retestPlan.riskCriteria.join(" ")).toContain("黄色或红色风险")
  })

  it("does not mutate task input while building a retest plan", () => {
    const task = {
      type: "SCHEMA",
      sourceReason: "补充结构化数据。",
      evidenceJson: {
        repairTask: {
          taskType: "schema_fix",
          nextSteps: ["补 FAQ Schema"],
        },
      },
    }
    const before = structuredClone(task)

    buildRepairTaskRetestPlan(task, null, null)

    expect(task).toEqual(before)
  })
})
