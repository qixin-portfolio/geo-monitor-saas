import { ArkProvider } from "./ark-provider"
import { DeepSeekProvider } from "./deepseek-provider"
import { OpenAIProvider } from "./openai-provider"
import type { MonitoringProvider } from "./provider"

export type MonitoringProviderName = "openai" | "deepseek" | "ark"

const DEFAULT_MODELS: Record<MonitoringProviderName, string> = {
  openai: "gpt-4o-mini",
  deepseek: "deepseek-chat",
  ark: "doubao-seed-2-1-pro-260628",
}

function isMonitoringProviderName(
  value: string | undefined
): value is MonitoringProviderName {
  return value === "openai" || value === "deepseek" || value === "ark"
}

function getPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export function getMonitoringConfig() {
  const providerName = isMonitoringProviderName(process.env.MONITORING_PROVIDER)
    ? process.env.MONITORING_PROVIDER
    : "openai"

  return {
    provider: providerName,
    model: process.env.MONITORING_MODEL || DEFAULT_MODELS[providerName],
    cronSecret: process.env.CRON_SECRET || process.env.MONITORING_CRON_SECRET || "",
    timeoutMs: getPositiveInteger(process.env.MONITORING_TIMEOUT_MS, 45_000),
    maxTokens: getPositiveInteger(process.env.MONITORING_MAX_TOKENS, 900),
  }
}

export function createProvider(): MonitoringProvider {
  const { provider: providerName } = getMonitoringConfig()

  if (providerName === "deepseek") {
    return new DeepSeekProvider()
  }
  if (providerName === "ark") {
    return new ArkProvider()
  }
  return new OpenAIProvider()
}
