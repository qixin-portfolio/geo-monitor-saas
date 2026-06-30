import { describe, expect, it } from "vitest"

import type { ContentBacklogTaskDraft } from "./map-repair-task-to-content-task"
import { validateRepairTaskDraft } from "./validate-repair-task-draft"

function draft(overrides: Partial<ContentBacklogTaskDraft> = {}): ContentBacklogTaskDraft {
  return {
    title: "新增可被 AI 引用的品牌证据页",
    type: "LOCAL_SERVICE_PAGE",
    priority: 90,
    sourceQuery: "交城装修公司推荐",
    sourceReason: "AI 没有找到清晰品牌证据，需要补充本地服务页和 FAQ。",
    targetKeyword: "交城装修公司推荐",
    targetAudience: "负责官网、内容和 GEO 修复的运营/市场人员",
    recommendedAngle: "围绕本地推荐问题补齐可引用页面证据。",
    evidenceJson: {
      source: "evidence_map",
      trigger: "missing_citable_brand_evidence",
      relatedQuery: "交城装修公司推荐",
      suggestedPage: "品牌介绍页 / 本地服务页 / FAQ",
      nextSteps: ["补充真实案例。", "增加 FAQ。"],
      repairTask: {
        taskType: "new_page",
        priority: "P0",
        evidenceGap: "missing_citable_brand_evidence",
        suggestedPage: "品牌介绍页 / 本地服务页 / FAQ",
        expectedImpact: "为后续 AI 答案提供稳定引用入口。",
        effortLevel: "M",
        nextSteps: ["补充真实案例。", "增加 FAQ。"],
      },
    },
    briefJson: {
      audience: "负责官网、内容和 GEO 修复的运营/市场人员",
      searchIntent: "交城装修公司推荐",
      angle: "新增可被 AI 引用的品牌证据页",
      differentiationTargets: ["品牌介绍页", "FAQ"],
      forbiddenClaims: ["不要承诺页面修改后 AI 答案会立即改变。"],
      evidenceNeeded: ["真实案例", "服务范围"],
      outline: ["补充真实案例。", "增加 FAQ。"],
      internalLinks: ["品牌介绍页 / 本地服务页 / FAQ"],
      llmsNotes: ["由 Evidence Map 的 RepairTask draft 映射而来。"],
    },
    ...overrides,
  }
}

describe("validateRepairTaskDraft", () => {
  it("accepts a normal content backlog draft", () => {
    const result = validateRepairTaskDraft(draft())

    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
    expect(result.sanitizedDraft?.type).toBe("LOCAL_SERVICE_PAGE")
    expect(result.sanitizedDraft?.evidenceJson).toMatchObject({
      trigger: "missing_citable_brand_evidence",
    })
  })

  it("rejects illegal task types", () => {
    const result = validateRepairTaskDraft(
      draft({ type: "DROP_TABLE" as ContentBacklogTaskDraft["type"] })
    )

    expect(result.valid).toBe(false)
    expect(result.errors).toContain("type 不在 GeoContentTaskType 白名单内")
    expect(result.sanitizedDraft).toBeNull()
  })

  it("rejects illegal top-level priority values", () => {
    const result = validateRepairTaskDraft(draft({ priority: 50 }))

    expect(result.valid).toBe(false)
    expect(result.errors).toContain("invalid priority：priority 不在白名单内")
    expect(result.sanitizedDraft).toBeNull()
  })

  it("truncates overlong title and description fields", () => {
    const result = validateRepairTaskDraft(
      draft({
        title: "标题".repeat(100),
        sourceReason: "描述".repeat(1_000),
      })
    )

    expect(result.valid).toBe(true)
    expect(result.sanitizedDraft?.title.length).toBeLessThanOrEqual(120)
    expect(result.sanitizedDraft?.sourceReason.length).toBeLessThanOrEqual(1_200)
  })

  it("rejects raw response fields", () => {
    const result = validateRepairTaskDraft({
      ...draft(),
      evidenceJson: {
        ...draft().evidenceJson,
        rawResponseJson: { answer: "full raw provider response" },
      },
    })

    expect(result.valid).toBe(false)
    expect(result.errors.join(" ")).toContain("raw response")
  })

  it("rejects nested raw response fields", () => {
    const result = validateRepairTaskDraft({
      ...draft(),
      evidenceJson: {
        source: "evidence_map",
        trigger: "missing_citable_brand_evidence",
        repairTask: {
          taskType: "new_page",
          priority: "P0",
          evidenceGap: "missing_citable_brand_evidence",
          nested: {
            fullResponse: "complete raw answer payload",
          },
        },
      },
    })

    expect(result.valid).toBe(false)
    expect(result.errors.join(" ")).toContain("raw response")
  })

  it("rejects secret-like fields and values", () => {
    const result = validateRepairTaskDraft({
      ...draft(),
      briefJson: {
        ...draft().briefJson,
        webhookSecret: "not-real-placeholder",
      },
    })

    expect(result.valid).toBe(false)
    expect(result.errors.join(" ")).toContain("secret")
  })

  it("rejects secret-like fields inside evidenceJson", () => {
    const result = validateRepairTaskDraft({
      ...draft(),
      evidenceJson: {
        ...draft().evidenceJson,
        apiKey: "not-real-placeholder",
      },
    })

    expect(result.valid).toBe(false)
    expect(result.errors.join(" ")).toContain("secret")
  })

  it("uses a safe fallback for empty related query fields", () => {
    const result = validateRepairTaskDraft(
      draft({
        sourceQuery: "",
        targetKeyword: "",
      })
    )

    expect(result.valid).toBe(true)
    expect(result.sanitizedDraft?.sourceQuery).toBe("待补充原始 query")
    expect(result.sanitizedDraft?.targetKeyword).toBe("待补充原始 query")
  })

  it("limits nextSteps count and length", () => {
    const longStep = "下一步".repeat(100)
    const result = validateRepairTaskDraft({
      ...draft(),
      evidenceJson: {
        ...draft().evidenceJson,
        nextSteps: [longStep, longStep, longStep, longStep, longStep, longStep, longStep],
        repairTask: {
          taskType: "new_page",
          priority: "P0",
          evidenceGap: "missing_citable_brand_evidence",
          nextSteps: [longStep, longStep, longStep, longStep, longStep, longStep, longStep],
        },
      },
    })

    const evidence = result.sanitizedDraft?.evidenceJson as { nextSteps?: string[] }

    expect(result.valid).toBe(true)
    expect(evidence.nextSteps).toHaveLength(6)
    expect(evidence.nextSteps?.every((step) => step.length <= 160)).toBe(true)
  })

  it("removes unknown evidenceJson and briefJson fields from sanitized output", () => {
    const result = validateRepairTaskDraft({
      ...draft(),
      evidenceJson: {
        ...draft().evidenceJson,
        arbitraryLargeField: "x".repeat(500),
        nestedUnknown: { anything: "should not pass" },
        repairTask: {
          taskType: "new_page",
          priority: "P0",
          evidenceGap: "missing_citable_brand_evidence",
          suggestedPage: "品牌介绍页 / 本地服务页 / FAQ",
          expectedImpact: "为后续 AI 答案提供稳定引用入口。",
          effortLevel: "M",
          nextSteps: ["补充真实案例。"],
          unexpectedNested: { value: "drop me" },
        },
      },
      briefJson: {
        ...draft().briefJson,
        arbitraryBriefField: "drop me",
        nestedBriefUnknown: { value: "drop me too" },
      },
    })
    const evidence = result.sanitizedDraft?.evidenceJson as Record<string, unknown>
    const repairTask = evidence.repairTask as Record<string, unknown>
    const brief = result.sanitizedDraft?.briefJson as Record<string, unknown>

    expect(result.valid).toBe(true)
    expect(evidence).not.toHaveProperty("arbitraryLargeField")
    expect(evidence).not.toHaveProperty("nestedUnknown")
    expect(repairTask).not.toHaveProperty("unexpectedNested")
    expect(brief).not.toHaveProperty("arbitraryBriefField")
    expect(brief).not.toHaveProperty("nestedBriefUnknown")
  })

  it("keeps sanitizedDraft limited to explicit top-level and nested whitelist fields", () => {
    const result = validateRepairTaskDraft(draft())
    const evidence = result.sanitizedDraft?.evidenceJson as Record<string, unknown>
    const repairTask = evidence.repairTask as Record<string, unknown>
    const brief = result.sanitizedDraft?.briefJson as Record<string, unknown>

    expect(Object.keys(result.sanitizedDraft ?? {}).sort()).toEqual([
      "briefJson",
      "evidenceJson",
      "priority",
      "recommendedAngle",
      "sourceQuery",
      "sourceReason",
      "targetAudience",
      "targetKeyword",
      "title",
      "type",
    ])
    expect(Object.keys(evidence).sort()).toEqual([
      "nextSteps",
      "relatedQuery",
      "repairTask",
      "source",
      "suggestedPage",
      "trigger",
    ])
    expect(Object.keys(repairTask).sort()).toEqual([
      "effortLevel",
      "evidenceGap",
      "expectedImpact",
      "nextSteps",
      "priority",
      "suggestedPage",
      "taskType",
    ])
    expect(Object.keys(brief).sort()).toEqual([
      "angle",
      "audience",
      "differentiationTargets",
      "evidenceNeeded",
      "forbiddenClaims",
      "internalLinks",
      "llmsNotes",
      "outline",
      "searchIntent",
    ])
  })
})
