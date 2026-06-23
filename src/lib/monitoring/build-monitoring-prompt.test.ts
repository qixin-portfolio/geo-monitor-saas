import { describe, expect, it } from "vitest"

import { buildMonitoringPrompt } from "./build-monitoring-prompt"

describe("buildMonitoringPrompt", () => {
  it("injects tenant context and preserves the exact query", () => {
    const prompt = buildMonitoringPrompt({
      brandName: "晟景装饰",
      industry: "装修",
      region: "交城",
      queryText: "交城装修公司哪家靠谱？",
    })

    expect(prompt).toContain("晟景装饰")
    expect(prompt).toContain("装修")
    expect(prompt).toContain("交城")
    expect(prompt).toContain("交城装修公司哪家靠谱？")
    expect(prompt).toContain("请列出推荐名单")
  })
})
