import { afterEach, describe, expect, it, vi } from "vitest"

import { runQuery } from "./run-query"

describe("runQuery", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("stores parsed output when the provider succeeds", async () => {
    vi.stubEnv("MONITORING_PROVIDER", "openai")
    vi.stubEnv("MONITORING_MODEL", "gpt-4o-mini")

    const provider = {
      call: vi.fn().mockResolvedValue({
        provider: "openai",
        model: "gpt-4o-mini",
        output: "1. 晟景装饰：案例多",
        durationMs: 100,
      }),
    }

    const result = await runQuery({
      query: { id: "query_1", text: "交城装修公司哪家靠谱？" },
      tenant: { brandName: "晟景装饰", industry: "装修", region: "交城" },
      provider,
    })

    expect(result.status).toBe("success")
    expect(result.provider).toBe("openai")
    expect(result.mentioned).toBe(true)
    expect(result.rank).toBe(1)
    expect(result.rawOutput).toContain("晟景装饰")
    expect(provider.call).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: "交城装修公司哪家靠谱？",
      })
    )
    expect(provider.call.mock.calls[0]?.[0].prompt).not.toContain("晟景装饰")
  })

  it("returns a failed result when the provider throws", async () => {
    vi.stubEnv("MONITORING_PROVIDER", "openai")
    vi.stubEnv("MONITORING_MODEL", "gpt-4o-mini")

    const provider = {
      call: vi.fn().mockRejectedValue(new Error("provider-down")),
    }

    const result = await runQuery({
      query: { id: "query_1", text: "交城装修公司哪家靠谱？" },
      tenant: { brandName: "晟景装饰", industry: "装修", region: "交城" },
      provider,
    })

    expect(result.status).toBe("failed")
    expect(result.provider).toBe("openai")
    expect(result.errorMessage).toContain("provider-down")
  })
})
