import OpenAI from "openai"

import type { AIProviderAdapter, AIProviderInvokeInput } from "./types"

export class DeepSeekAdapter implements AIProviderAdapter {
  id = "deepseek"
  name = "DeepSeek"
  defaultModel = "deepseek-chat"

  async invoke(input: AIProviderInvokeInput) {
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error("DEEPSEEK_API_KEY is not configured")
    }

    const client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com",
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
