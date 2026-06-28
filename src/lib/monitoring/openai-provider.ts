import OpenAI from "openai"

import type {
  MonitoringProvider,
  ProviderCallInput,
  ProviderCallResult,
} from "./provider"

export class OpenAIProvider implements MonitoringProvider {
  async call({ prompt, model }: ProviderCallInput): Promise<ProviderCallResult> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured")
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const rawRequestJson = {
      provider: "openai",
      model,
      input: prompt,
    }
    const startedAt = Date.now()

    const response = await client.responses.create({
      model,
      input: prompt,
    })

    return {
      provider: "openai",
      model,
      output: response.output_text,
      durationMs: Date.now() - startedAt,
      inputTokens: response.usage?.input_tokens ?? null,
      outputTokens: response.usage?.output_tokens ?? null,
      totalTokens: response.usage?.total_tokens ?? null,
      rawRequestJson,
      rawResponseJson: response,
    }
  }
}
