import { describe, expect, it } from "vitest"

import type { EvidenceMapItem } from "./extract-evidence-map"
import { mapEvidenceGapToRepairTask } from "./map-evidence-gap-to-repair-task"

function item(overrides: Partial<EvidenceMapItem>): EvidenceMapItem {
  return {
    query: "交城装修公司推荐",
    brandMentioned: false,
    competitorsMentioned: [],
    sourceTypes: ["unknown"],
    evidenceGap: "missing_citable_brand_evidence",
    suggestedAction: "补充品牌证据",
    suggestedPage: "品牌介绍页 / 本地服务页 / FAQ",
    priority: "P0",
    confidence: 0.78,
    reason: "缺少证据",
    ...overrides,
  }
}

describe("mapEvidenceGapToRepairTask", () => {
  it("maps competitor advantage to a competitor counter task", () => {
    const task = mapEvidenceGapToRepairTask(
      item({
        competitorsMentioned: ["家装e站", "交换空间"],
        evidenceGap: "competitor_evidence_advantage",
      })
    )

    expect(task.taskType).toBe("competitor_counter")
    expect(task.priority).toBe("P0")
  })

  it("maps missing citable evidence to a new page task", () => {
    const task = mapEvidenceGapToRepairTask(item({ evidenceGap: "missing_citable_brand_evidence" }))

    expect(task.taskType).toBe("new_page")
  })

  it("maps weak brand definition to a page update task", () => {
    const task = mapEvidenceGapToRepairTask(
      item({
        brandMentioned: true,
        sourceTypes: ["official_site"],
        evidenceGap: "weak_brand_definition",
        priority: "P1",
      })
    )

    expect(task.taskType).toBe("page_update")
  })

  it("maps contract or complaint queries to sentiment defense", () => {
    const task = mapEvidenceGapToRepairTask(
      item({
        query: "装修合同增项投诉怎么办",
        evidenceGap: "competitor_evidence_advantage",
      })
    )

    expect(task.taskType).toBe("sentiment_defense")
  })
})
