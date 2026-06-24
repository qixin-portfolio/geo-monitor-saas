import { DeepSeekProvider } from "./deepseek-provider"
import { OpenAIProvider } from "./openai-provider"
import type { MonitoringProvider } from "./provider"

export type MonitoringProviderName = "openai" | "deepseek"

export function getMonitoringConfig() {
  const providerName: MonitoringProviderName =
    (process.env.MONITORING_PROVIDER as MonitoringProviderName) || "openai"

  return {
    provider: providerName,
    model:
      process.env.MONITORING_MODEL ||
      (providerName === "deepseek" ? "deepseek-chat" : "gpt-4o-mini"),
    cronSecret: process.env.MONITORING_CRON_SECRET || "",
  }
}

export function createProvider(): MonitoringProvider {
  const { provider: providerName } = getMonitoringConfig()

  if (providerName === "deepseek") {
    return new DeepSeekProvider()
  }
  return new OpenAIProvider()
}
