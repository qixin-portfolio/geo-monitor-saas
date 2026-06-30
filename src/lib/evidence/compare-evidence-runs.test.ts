import { describe, expect, it } from "vitest"

import type { EvidenceMapItem } from "./extract-evidence-map"
import { compareEvidenceRuns } from "./compare-evidence-runs"

function evidenceItem(overrides: Partial<EvidenceMapItem>): EvidenceMapItem {
  return {
    query: "交城装修公司推荐",
    brandMentioned: false,
    competitorsMentioned: [],
    sourceTypes: ["unknown"],
    evidenceGap: "missing_citable_brand_evidence",
    suggestedAction: "补充品牌证据。",
    suggestedPage: "品牌介绍页 / 本地服务页 / FAQ",
    priority: "P0",
    confidence: 0.78,
    reason: "AI 没有提到本品牌。",
    ...overrides,
  }
}

describe("compareEvidenceRuns", () => {
  it("marks brand mention gained as improved", () => {
    const comparison = compareEvidenceRuns({
      previous: evidenceItem({ brandMentioned: false }),
      current: evidenceItem({ brandMentioned: true, evidenceGap: "no_major_gap", priority: "P2" }),
    })

    expect(comparison.brandMentionChange).toBe("gained")
    expect(comparison.overallChange).toBe("improved")
    expect(comparison.reason).toContain("品牌从未提及变成已提及")
  })

  it("marks brand mention lost as worsened", () => {
    const comparison = compareEvidenceRuns({
      previous: evidenceItem({ brandMentioned: true, evidenceGap: "no_major_gap", priority: "P2" }),
      current: evidenceItem({ brandMentioned: false }),
    })

    expect(comparison.brandMentionChange).toBe("lost")
    expect(comparison.overallChange).toBe("worsened")
  })

  it("marks fewer competitors as improved", () => {
    const comparison = compareEvidenceRuns({
      previous: evidenceItem({ competitorsMentioned: ["家装e站", "交换空间"] }),
      current: evidenceItem({ competitorsMentioned: ["家装e站"] }),
    })

    expect(comparison.competitorChangeSummary).toBe("improved")
    expect(comparison.overallChange).toBe("improved")
  })

  it("marks unknown to official site source as improved", () => {
    const comparison = compareEvidenceRuns({
      previous: evidenceItem({ sourceTypes: ["unknown"] }),
      current: evidenceItem({ sourceTypes: ["official_site"] }),
    })

    expect(comparison.sourceTypeChangeSummary).toBe("improved")
    expect(comparison.overallChange).toBe("improved")
  })

  it("marks P0 gap to P1 gap as improved", () => {
    const comparison = compareEvidenceRuns({
      previous: evidenceItem({ evidenceGap: "competitor_evidence_advantage", priority: "P0" }),
      current: evidenceItem({ evidenceGap: "weak_brand_definition", priority: "P1" }),
    })

    expect(comparison.gapChange).toBe("improved")
    expect(comparison.overallChange).toBe("improved")
  })

  it("returns unknown when previous run is missing", () => {
    const comparison = compareEvidenceRuns({
      previous: null,
      current: evidenceItem({ brandMentioned: true }),
    })

    expect(comparison.previousBrandMentioned).toBeNull()
    expect(comparison.overallChange).toBe("unknown")
    expect(comparison.confidence).toBeLessThan(0.4)
  })

  it("marks unchanged runs as unchanged", () => {
    const previous = evidenceItem({
      brandMentioned: true,
      competitorsMentioned: ["家装e站"],
      sourceTypes: ["official_site"],
      evidenceGap: "no_major_gap",
      priority: "P2",
    })
    const current = evidenceItem({
      brandMentioned: true,
      competitorsMentioned: ["家装e站"],
      sourceTypes: ["official_site"],
      evidenceGap: "no_major_gap",
      priority: "P2",
    })
    const comparison = compareEvidenceRuns({ previous, current })

    expect(comparison.brandMentionChange).toBe("unchanged_positive")
    expect(comparison.competitorChangeSummary).toBe("unchanged")
    expect(comparison.sourceTypeChangeSummary).toBe("unchanged")
    expect(comparison.gapChange).toBe("unchanged")
    expect(comparison.overallChange).toBe("unchanged")
  })
})
