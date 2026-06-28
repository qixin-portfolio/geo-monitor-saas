import { describe, expect, it } from "vitest"

import {
  aggregateCompetitors,
  mentionStatusLabel,
  providerDisplayName,
  summarizeRuns,
} from "./report-view"

describe("report-view", () => {
  it("labels missing mentions as a monitoring result, not a failure", () => {
    expect(
      mentionStatusLabel({
        mentioned: false,
        rank: null,
        analysis: { mentionStatus: "NONE" },
      })
    ).toBe("未自然提及")
  })

  it("formats ark as Doubao Ark", () => {
    expect(providerDisplayName("ark")).toBe("豆包 Ark")
  })

  it("filters generic competitor names from summaries", () => {
    const competitors = aggregateCompetitors([
      {
        id: "run_1",
        status: "SUCCESS",
        provider: "ark",
        model: "doubao",
        mentioned: false,
        rank: null,
        competitors: ["整体装修", "交城宜家装饰", "设计师"],
        query: { text: "交城装修公司推荐" },
      },
    ])

    expect(competitors.map((item) => item.name)).toEqual(["交城宜家装饰"])
  })

  it("summarizes a zero-mention batch clearly", () => {
    const summary = summarizeRuns({
      brandName: "晟景装饰",
      runs: [
        {
          id: "run_1",
          status: "SUCCESS",
          provider: "ark",
          model: "doubao",
          mentioned: false,
          rank: null,
          competitors: [],
          analysis: {
            mentionStatus: "NONE",
            visibilityScore: 0,
          },
        },
      ],
    })

    expect(summary.mentionRate).toBe(0)
    expect(summary.recommendationRate).toBe(0)
    expect(summary.conclusion).toContain("没有自然提及 晟景装饰")
  })
})
