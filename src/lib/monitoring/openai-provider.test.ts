import { afterEach, describe, expect, it, vi } from "vitest"

const createMock = vi.hoisted(() => vi.fn())

vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    responses: {
      create: createMock,
    },
  })),
}))

import { OpenAIProvider } from "./openai-provider"

describe("OpenAIProvider", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it("passes monitoring timeout and max token limits to OpenAI", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key")
    vi.stubEnv("MONITORING_TIMEOUT_MS", "1234")
    vi.stubEnv("MONITORING_MAX_TOKENS", "321")
    createMock.mockResolvedValueOnce({
      output_text: "Smoke Brand was mentioned.",
      usage: {
        input_tokens: 10,
        output_tokens: 4,
        total_tokens: 14,
      },
    })

    const provider = new OpenAIProvider()
    const result = await provider.call({
      prompt: "single test prompt",
      model: "gpt-4o-mini",
    })

    expect(createMock).toHaveBeenCalledWith(
      {
        model: "gpt-4o-mini",
        input: "single test prompt",
        max_output_tokens: 321,
      },
      { timeout: 1234 }
    )
    expect(result.output).toBe("Smoke Brand was mentioned.")
  })
})
