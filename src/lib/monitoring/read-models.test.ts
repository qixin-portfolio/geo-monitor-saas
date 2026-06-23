import { describe, expect, it } from "vitest"

import { mapDashboardSnapshot, mapQueryMonitoringRows } from "./read-models"

describe("mapDashboardSnapshot", () => {
  it("prefers automated snapshot data when it exists", () => {
    const result = mapDashboardSnapshot({
      tenantName: "晟景装饰",
      latestSnapshot: {
        mentionRate: 66,
        averageRank: 1.5,
        competitorList: ["交城宜家装饰"],
        anomalyFlags: ["mention-rate-drop"],
      },
      recentBatches: [
        { status: "SUCCESS", createdAt: new Date("2026-06-23T10:00:00Z") },
      ],
    })

    expect(result.mentionRate).toBe(66)
    expect(result.anomalyFlags).toContain("mention-rate-drop")
  })
})

describe("mapQueryMonitoringRows", () => {
  it("returns each query with its latest run", () => {
    const rows = mapQueryMonitoringRows([
      {
        id: "query_1",
        text: "交城装修公司哪家靠谱？",
        platform: "manual",
        active: true,
        queryRuns: [
          {
            id: "run_1",
            status: "SUCCESS",
            mentioned: true,
            rank: 1,
            competitors: [],
            errorMessage: null,
            createdAt: new Date("2026-06-23T10:00:00Z"),
          },
        ],
        responses: [],
      },
    ])

    expect(rows[0].latestRun?.status).toBe("SUCCESS")
    expect(rows[0].latestRun?.rank).toBe(1)
  })
})
