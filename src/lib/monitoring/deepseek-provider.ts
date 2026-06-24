import OpenAI from "openai"

import type {
  MonitoringProvider,
  ProviderCallInput,
  ProviderCallResult,
} from "./provider"

export class DeepSeekProvider implements MonitoringProvider {
  async call({ prompt, model }: ProviderCallInput): Promise<ProviderCallResult> {
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error("DEEPSEEK_API_KEY is not configured")
    }

    const client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com",
    })

    const startedAt = Date.now()

    const response = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
    })

    return {
      provider: "deepseek",
      model,
      output: response.choices[0]?.message?.content ?? "",
      durationMs: Date.now() - startedAt,
    }
  }
}
