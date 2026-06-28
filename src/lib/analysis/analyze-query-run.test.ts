import { describe, expect, it } from "vitest"

import { buildAnalysisDraft } from "./analyze-query-run"
import { extractCompetitors } from "./extract-competitors"

describe("buildAnalysisDraft", () => {
  it("returns NONE and visibilityScore 0 when brandName is absent", () => {
    const draft = buildAnalysisDraft({
      brandName: "晟景装饰",
      rawOutput: "建议先看本地口碑、报价和施工合同，再去工地考察。",
    })

    expect(draft.mentionStatus).toBe("NONE")
    expect(draft.brandMentioned).toBe(false)
    expect(draft.visibilityScore).toBe(0)
  })

  it("returns MENTIONED when brandName appears in ordinary description", () => {
    const draft = buildAnalysisDraft({
      brandName: "晟景装饰",
      rawOutput: "晟景装饰是本地装修公司之一，也可以再对比其他品牌。",
    })

    expect(draft.mentionStatus).toBe("MENTIONED")
    expect(draft.rankType).toBe("UNRANKED")
    expect(draft.visibilityScore).toBe(25)
  })

  it("returns RECOMMENDED and rank 2 when brandName appears in numbered list", () => {
    const draft = buildAnalysisDraft({
      brandName: "晟景装饰",
      rawOutput: "1. 交城华浔品味装饰：口碑不错\n2. 晟景装饰：透明工地做得好",
    })

    expect(draft.mentionStatus).toBe("RECOMMENDED")
    expect(draft.rankType).toBe("EXPLICIT")
    expect(draft.brandRank).toBe(2)
    expect(draft.visibilityScore).toBe(90)
  })
})

describe("extractCompetitors", () => {
  it("does not treat generic renovation phrases as competitors", () => {
    const competitors = extractCompetitors({
      brandName: "晟景装饰",
      rawOutput: "整体装修要看预算，免费设计和施工队都要谨慎。",
    })

    expect(competitors).toEqual([])
  })

  it("extracts concrete local decoration company names", () => {
    const competitors = extractCompetitors({
      brandName: "晟景装饰",
      rawOutput: "1. 交城华浔品味装饰：口碑较好\n2. 交城华杰装饰：报价适中",
    })

    expect(competitors.map((item) => item.name)).toEqual([
      "交城华浔品味装饰",
      "交城华杰装饰",
    ])
  })
})
