import { describe, expect, it } from "vitest"

import { extractEvidenceMap } from "./extract-evidence-map"
import {
  SAMPLE_BRAND_NAME,
  SAMPLE_COMPETITORS,
  realRunSamples,
} from "./fixtures/real-run-samples"

function firstItem(input: Parameters<typeof extractEvidenceMap>[0]) {
  return extractEvidenceMap(input)[0]
}

describe("extractEvidenceMap", () => {
  it("detects brand mentions", () => {
    const sample = realRunSamples.brandMentionedQualitySources
    const item = firstItem({
      query: sample.query,
      answer: sample.answer,
      brandName: sample.brandName,
    })

    expect(item.brandMentioned).toBe(true)
  })

  it("detects default competitors", () => {
    const item = firstItem({
      query: "本地装修哪家好",
      answer: "可以对比家装e站和交换空间的服务案例。",
      brandName: SAMPLE_BRAND_NAME,
    })

    expect(item.competitorsMentioned).toEqual(["家装e站", "交换空间"])
  })

  it("detects custom competitors with spacing differences", () => {
    const item = firstItem({
      query: realRunSamples.brandMissingCompetitorMentioned.query,
      answer: "可重点对比竞品 A 装饰和竞品B空间的服务案例。",
      brandName: SAMPLE_BRAND_NAME,
      competitors: SAMPLE_COMPETITORS,
    })

    expect(item.competitorsMentioned).toEqual(["竞品A装饰", "竞品B空间"])
  })

  it("detects business registry source types", () => {
    const sample = realRunSamples.brandMentionedRegistryOnly
    const item = firstItem({
      query: sample.query,
      answer: sample.answer,
      brandName: sample.brandName,
    })

    expect(item.sourceTypes).toContain("business_registry")
  })

  it("detects official site source types", () => {
    const item = firstItem({
      query: "示例装饰官网",
      answer: "可以查看官网、网站或 official site 上的案例。",
      brandName: SAMPLE_BRAND_NAME,
    })

    expect(item.sourceTypes).toContain("official_site")
  })

  it("marks competitor evidence advantage as P0", () => {
    const sample = realRunSamples.brandMissingCompetitorMentioned
    const item = firstItem({
      query: sample.query,
      answer: sample.answer,
      brandName: sample.brandName,
      competitors: sample.competitors,
    })

    expect(item.evidenceGap).toBe("competitor_evidence_advantage")
    expect(item.priority).toBe("P0")
  })

  it("marks weak brand definition as P1 when only registry evidence is visible", () => {
    const sample = realRunSamples.brandMentionedRegistryOnly
    const item = firstItem({
      query: sample.query,
      answer: sample.answer,
      brandName: sample.brandName,
      competitors: sample.competitors,
    })

    expect(item.evidenceGap).toBe("weak_brand_definition")
    expect(item.priority).toBe("P1")
  })

  it("does not mark brand definition weak when quality sources are visible", () => {
    const sample = realRunSamples.brandMentionedQualitySources
    const item = firstItem({
      query: sample.query,
      answer: sample.answer,
      brandName: sample.brandName,
      competitors: sample.competitors,
    })

    expect(item.sourceTypes).toEqual(
      expect.arrayContaining(["official_site", "local_listing", "authority_media"])
    )
    expect(item.evidenceGap).toBe("no_major_gap")
  })

  it.each([
    ["本地装修哪家好", "本地推荐页 / 案例页 / 客户评价页"],
    ["透明工地进度日报怎么看", "透明工地介绍页 / 工长日报页 / 工地案例页"],
    ["环保板材和甲醛怎么验收", "环保材料说明页 / 材料验收页"],
    ["装修合同增项售后投诉怎么办", "合同说明页 / 售后保障页 / 舆情防御 FAQ"],
  ])("maps query '%s' to suggested page '%s'", (query, expectedPage) => {
    const item = firstItem({
      query,
      answer: "暂无明确品牌证据。",
      brandName: SAMPLE_BRAND_NAME,
    })

    expect(item.suggestedPage).toBe(expectedPage)
  })

  it("handles empty answer, empty query, empty competitors, and empty brand", () => {
    const item = firstItem({
      query: "",
      answer: "",
      brandName: "",
      competitors: [],
    })

    expect(item.query).toBe("")
    expect(item.brandMentioned).toBe(false)
    expect(item.competitorsMentioned).toEqual([])
    expect(item.sourceTypes).toEqual(["unknown"])
    expect(item.confidence).toBeLessThanOrEqual(0.35)
  })
})
