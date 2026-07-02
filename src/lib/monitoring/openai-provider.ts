import OpenAI from "openai"

import type {
  MonitoringProvider,
  ProviderCallInput,
  ProviderCallResult,
} from "./provider"
import { getMonitoringConfig } from "./config"

export class OpenAIProvider implements MonitoringProvider {
  async call({ prompt, model }: ProviderCallInput): Promise<ProviderCallResult> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured")
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    const config = getMonitoringConfig()

    const rawRequestJson = {
      provider: "openai",
      model,
      input: prompt,
      max_output_tokens: config.maxTokens,
    }
    const startedAt = Date.now()

    const response = await client.responses.create(
      {
        model,
        input: prompt,
        max_output_tokens: config.maxTokens,
      },
      { timeout: config.timeoutMs }
    )

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
