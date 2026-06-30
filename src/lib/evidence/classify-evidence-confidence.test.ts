import { describe, expect, it } from "vitest"

import type { AnswerSourceDraft } from "./extract-answer-sources"
import type { EvidenceMapItem } from "./extract-evidence-map"
import { classifyEvidenceConfidence } from "./classify-evidence-confidence"
import { compareEvidenceRuns } from "./compare-evidence-runs"

function evidenceItem(overrides: Partial<EvidenceMapItem>): EvidenceMapItem {
  return {
    query: "本地装修公司推荐",
    brandMentioned: false,
    competitorsMentioned: [],
    sourceTypes: ["unknown"],
    evidenceGap: "missing_citable_brand_evidence",
    suggestedAction: "补充品牌证据。",
    suggestedPage: "品牌介绍页 / 本地服务页 / FAQ",
    priority: "P0",
    confidence: 0.55,
    reason: "系统推断。",
    ...overrides,
  }
}

function answerSource(overrides: Partial<AnswerSourceDraft>): AnswerSourceDraft {
  return {
    url: "https://brand.example/cases",
    domain: "brand.example",
    title: "案例中心",
    snippet: "官网案例页。",
    sourceType: "official_site",
    isOwned: true,
    isCompetitor: false,
    confidence: 0.82,
    extractionMethod: "citations_json",
    ...overrides,
  }
}

describe("classifyEvidenceConfidence", () => {
  it("marks URL plus official site evidence as high confidence", () => {
    const label = classifyEvidenceConfidence({
      evidenceItem: evidenceItem({
        brandMentioned: true,
        sourceTypes: ["official_site"],
        evidenceGap: "no_major_gap",
        priority: "P2",
      }),
      answerSources: [answerSource({})],
      answer: "示例装饰官网展示了案例和透明工地信息。",
      citationsJson: [{ url: "https://brand.example/cases" }],
    })

    expect(label.confidenceLevel).toBe("high")
    expect(label.confidenceScore).toBeGreaterThanOrEqual(75)
    expect(label.reasons).toEqual(expect.arrayContaining(["明确命中品牌名", "命中官网、本地列表或权威媒体来源"]))
  })

  it("marks explicit competitor mentions without URL as medium confidence", () => {
    const label = classifyEvidenceConfidence({
      evidenceItem: evidenceItem({
        competitorsMentioned: ["竞品A装饰"],
        sourceTypes: ["unknown"],
      }),
      answer: "本地装修公司对比时，竞品A装饰在回答中被明确提到，但没有给出引用链接。",
      citationsJson: [],
    })

    expect(label.confidenceLevel).toBe("medium")
    expect(label.reasons.join(" ")).toContain("明确命中竞品名")
    expect(label.warnings.join(" ")).toContain("sourceType")
  })

  it("marks invalid citationsJson as low confidence", () => {
    const label = classifyEvidenceConfidence({
      evidenceItem: evidenceItem({ sourceTypes: ["unknown"] }),
      answer: "回答没有提供可识别 URL。",
      citationsJson: "{not-json",
    })

    expect(label.confidenceLevel).toBe("low")
    expect(label.warnings.join(" ")).toContain("解析失败")
  })

  it("marks unknown source type as low confidence when there are no stronger signals", () => {
    const label = classifyEvidenceConfidence({
      evidenceItem: evidenceItem({ sourceTypes: ["unknown"] }),
      answer: "这是一段普通回答，没有品牌、竞品或来源线索。",
      citationsJson: [],
    })

    expect(label.confidenceLevel).toBe("low")
    expect(label.warnings.join(" ")).toContain("sourceType 为 unknown")
  })

  it("marks empty answer and summary as low confidence", () => {
    const label = classifyEvidenceConfidence({
      evidenceItem: evidenceItem({}),
      answer: "",
      summary: null,
    })

    expect(label.confidenceLevel).toBe("low")
    expect(label.confidenceScore).toBeLessThanOrEqual(30)
    expect(label.warnings.join(" ")).toContain("为空或过短")
  })

  it("marks missing previous run comparison as low confidence when evidence is sparse", () => {
    const current = evidenceItem({ sourceTypes: ["unknown"] })
    const label = classifyEvidenceConfidence({
      evidenceItem: current,
      answer: "缺少历史样本时只能先展示数据不足。",
      comparison: compareEvidenceRuns({ previous: null, current }),
    })

    expect(label.confidenceLevel).toBe("low")
    expect(label.warnings.join(" ")).toContain("缺少历史 run")
  })

  it("marks multiple strong signals as high confidence", () => {
    const previous = evidenceItem({
      brandMentioned: false,
      competitorsMentioned: ["竞品A装饰"],
      sourceTypes: ["unknown"],
    })
    const current = evidenceItem({
      brandMentioned: true,
      competitorsMentioned: ["竞品A装饰"],
      sourceTypes: ["official_site", "local_listing", "authority_media"],
      evidenceGap: "no_major_gap",
      priority: "P2",
    })
    const label = classifyEvidenceConfidence({
      evidenceItem: current,
      answerSources: [
        answerSource({ sourceType: "official_site" }),
        answerSource({
          url: "https://map.example/listing/demo",
          domain: "map.example",
          sourceType: "local_listing",
          isOwned: false,
        }),
      ],
      answer: "示例装饰在官网、本地列表和行业报道中都出现，竞品A装饰也被提及。",
      citationsJson: [
        { url: "https://brand.example/cases" },
        { url: "https://map.example/listing/demo" },
      ],
      comparison: compareEvidenceRuns({ previous, current }),
    })

    expect(label.confidenceLevel).toBe("high")
    expect(label.confidenceScore).toBeGreaterThanOrEqual(85)
    expect(label.reasons.length).toBeGreaterThanOrEqual(4)
  })
})
