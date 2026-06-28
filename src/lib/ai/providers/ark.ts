import OpenAI from "openai"

import type {
  AIProviderAdapter,
  AIProviderInvokeInput,
  AIProviderInvokeResult,
} from "./types"

export class ArkAdapter implements AIProviderAdapter {
  id = "ark"
  name = "Volcano Ark"
  defaultModel =
    process.env.ARK_MODEL ||
    process.env.ARK_ENDPOINT_ID ||
    "doubao-seed-2-1-pro-260628"

  async invoke(input: AIProviderInvokeInput): Promise<AIProviderInvokeResult> {
    if (!process.env.ARK_API_KEY) {
      throw new Error("ARK_API_KEY is not configured")
    }

    const client = new OpenAI({
      apiKey: process.env.ARK_API_KEY,
      baseURL: process.env.ARK_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3",
    })

    const startedAt = Date.now()
    const controller = new AbortController()
    const timeout =
      input.timeoutMs === undefined
        ? undefined
        : setTimeout(() => controller.abort(), input.timeoutMs)

    try {
      const response = await client.chat.completions.create(
        {
          model: input.model ?? this.defaultModel,
          messages: [{ role: "user", content: input.prompt }],
          temperature: input.temperature,
          max_tokens: input.maxTokens,
        },
        { signal: controller.signal, timeout: input.timeoutMs }
      )

      return {
        text: response.choices[0]?.message?.content ?? "",
        rawJson: response,
        latencyMs: Date.now() - startedAt,
        inputTokens: response.usage?.prompt_tokens,
        outputTokens: response.usage?.completion_tokens,
        totalTokens: response.usage?.total_tokens,
      }
    } finally {
      if (timeout) clearTimeout(timeout)
    }
  }
}
