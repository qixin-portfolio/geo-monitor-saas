import { ArkAdapter } from "@/lib/ai/providers/ark"

import { getMonitoringConfig } from "./config"
import type {
  MonitoringProvider,
  ProviderCallInput,
  ProviderCallResult,
} from "./provider"

export class ArkProvider implements MonitoringProvider {
  async call({ prompt, model }: ProviderCallInput): Promise<ProviderCallResult> {
    const adapter = new ArkAdapter()
    const config = getMonitoringConfig()
    const rawRequestJson = {
      provider: "ark",
      model,
      prompt,
    }
    const result = await adapter.invoke({
      model,
      prompt,
      temperature: 0.2,
      timeoutMs: config.timeoutMs,
      maxTokens: config.maxTokens,
    })

    return {
      provider: "ark",
      model,
      output: result.text,
      durationMs: result.latencyMs ?? null,
      inputTokens: result.inputTokens ?? null,
      outputTokens: result.outputTokens ?? null,
      totalTokens: result.totalTokens ?? null,
      rawRequestJson,
      rawResponseJson: result.rawJson ?? null,
    }
  }
}
