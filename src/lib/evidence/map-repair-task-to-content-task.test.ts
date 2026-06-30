import { describe, expect, it } from "vitest"

import type { RepairTaskDraft } from "./map-evidence-gap-to-repair-task"
import { mapRepairTaskToContentTask } from "./map-repair-task-to-content-task"

function repairTask(overrides: Partial<RepairTaskDraft>): RepairTaskDraft {
  return {
    taskType: "new_page",
    priority: "P0",
    title: "新增可被 AI 引用的品牌证据页",
    description: "AI 没有找到清晰品牌证据。",
    suggestedPage: "品牌介绍页 / 本地服务页 / FAQ",
    relatedQuery: "交城装修公司推荐",
    evidenceGap: "missing_citable_brand_evidence",
    expectedImpact: "为后续 AI 答案提供稳定引用入口。",
    effortLevel: "M",
    nextSteps: ["补充真实案例。", "增加 FAQ。"],
    ...overrides,
  }
}

describe("mapRepairTaskToContentTask", () => {
  it("maps competitor evidence advantage to a comparison backlog draft", () => {
    const draft = mapRepairTaskToContentTask(
      repairTask({
        taskType: "competitor_counter",
        evidenceGap: "competitor_evidence_advantage",
        title: "补齐竞品对比与本地推荐证据",
      })
    )
    const evidence = draft.evidenceJson as { repairTask: { taskType: string; evidenceGap: string } }

    expect(draft.type).toBe("COMPARISON")
    expect(draft.priority).toBe(90)
    expect(evidence.repairTask.taskType).toBe("competitor_counter")
    expect(evidence.repairTask.evidenceGap).toBe("competitor_evidence_advantage")
  })

  it("keeps missing citable brand evidence in metadata", () => {
    const draft = mapRepairTaskToContentTask(
      repairTask({ evidenceGap: "missing_citable_brand_evidence" })
    )
    const evidence = draft.evidenceJson as { trigger: string; suggestedPage: string }

    expect(draft.type).toBe("LOCAL_SERVICE_PAGE")
    expect(evidence.trigger).toBe("missing_citable_brand_evidence")
    expect(evidence.suggestedPage).toContain("品牌介绍页")
  })

  it("maps weak brand definition page updates to local service page drafts", () => {
    const draft = mapRepairTaskToContentTask(
      repairTask({
        taskType: "page_update",
        priority: "P1",
        evidenceGap: "weak_brand_definition",
      })
    )

    expect(draft.type).toBe("LOCAL_SERVICE_PAGE")
    expect(draft.priority).toBe(70)
    expect(draft.sourceReason).toContain("weak_brand_definition")
  })

  it("maps sentiment defense to FAQ drafts", () => {
    const draft = mapRepairTaskToContentTask(
      repairTask({
        taskType: "sentiment_defense",
        title: "补齐风险问题 FAQ 与舆情防御内容",
        relatedQuery: "装修合同增项投诉怎么办",
      })
    )
    const brief = draft.briefJson as { outline: string[] }

    expect(draft.type).toBe("FAQ")
    expect(brief.outline).toEqual(["补充真实案例。", "增加 FAQ。"])
  })

  it("maps new page drafts to existing content backlog fields", () => {
    const draft = mapRepairTaskToContentTask(repairTask({ taskType: "new_page" }))
    const brief = draft.briefJson as { internalLinks: string[]; evidenceNeeded: string[] }

    expect(draft.type).toBe("LOCAL_SERVICE_PAGE")
    expect(draft.targetKeyword).toBe("交城装修公司推荐")
    expect(brief.internalLinks).toContain("品牌介绍页 / 本地服务页 / FAQ")
    expect(brief.evidenceNeeded.join(" ")).toContain("稳定引用入口")
  })

  it("maps page update drafts without database fields", () => {
    const draft = mapRepairTaskToContentTask(repairTask({ taskType: "page_update" }))

    expect(draft.type).toBe("LOCAL_SERVICE_PAGE")
    expect(Object.keys(draft)).not.toContain("tenantId")
    expect(Object.keys(draft)).not.toContain("id")
  })
})
