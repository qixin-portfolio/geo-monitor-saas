import { describe, expect, it } from "vitest"

import { buildInsightSnapshot } from "./build-insight-snapshot"

describe("buildInsightSnapshot", () => {
  it("computes mention rate, average rank, trend, and anomalies", () => {
    const snapshot = buildInsightSnapshot({
      previous: {
        mentionRate: 80,
        averageRank: 1.5,
        competitorList: ["交城宜家装饰"],
        trendDirection: "flat",
        anomalyFlags: [],
      },
      queryRuns: [
        {
          status: "success",
          mentioned: true,
          rank: 2,
          competitors: ["交城宜家装饰"],
        },
        {
          status: "success",
          mentioned: false,
          rank: null,
          competitors: ["星河装修"],
        },
      ],
    })

    expect(snapshot.mentionRate).toBe(50)
    expect(snapshot.averageRank).toBe(2)
    expect(snapshot.competitorList).toEqual(["交城宜家装饰", "星河装修"])
    expect(snapshot.trendDirection).toBe("down")
    expect(snapshot.anomalyFlags).toContain("mention-rate-drop")
  })
})
