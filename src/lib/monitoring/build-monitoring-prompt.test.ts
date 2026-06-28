import { describe, expect, it } from "vitest"

import { buildMonitoringPrompt } from "./build-monitoring-prompt"

describe("buildMonitoringPrompt", () => {
  it("uses the exact user query without leaking monitored brand context", () => {
    const prompt = buildMonitoringPrompt({
      queryText: "交城装修公司哪家靠谱？",
    })

    expect(prompt).toBe("交城装修公司哪家靠谱？")
    expect(prompt).not.toContain("晟景装饰")
    expect(prompt).not.toContain("品牌")
  })
})
