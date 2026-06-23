import { buildMonitoringPrompt } from "./build-monitoring-prompt"
import { getMonitoringConfig } from "./config"
import { parseMonitoringOutput } from "./parse-monitoring-output"
import type { MonitoringProvider } from "./provider"

type RunQueryInput = {
  query: { id: string; text: string }
  tenant: { brandName: string | null; industry: string | null; region: string | null }
  provider: MonitoringProvider
}

export async function runQuery({ query, tenant, provider }: RunQueryInput) {
  const brandName = tenant.brandName?.trim() || "未设置品牌"
  const prompt = buildMonitoringPrompt({
    brandName,
    industry: tenant.industry,
    region: tenant.region,
    queryText: query.text,
  })

  try {
    const { provider: providerName, model, output } = await provider.call({
      prompt,
      model: getMonitoringConfig().model,
    })

    const parsed = parseMonitoringOutput({
      brandName,
      answer: output,
    })

    return {
      status: "success" as const,
      provider: providerName,
      model,
      prompt,
      rawOutput: output,
      mentioned: parsed.mentioned,
      rank: parsed.rank,
      competitors: parsed.competitors,
      notes: parsed.notes,
      errorMessage: null,
    }
  } catch (error) {
    return {
      status: "failed" as const,
      provider: getMonitoringConfig().provider,
      model: getMonitoringConfig().model,
      prompt,
      rawOutput: null,
      mentioned: false,
      rank: null,
      competitors: [],
      notes: null,
      errorMessage: error instanceof Error ? error.message : "unknown-provider-error",
    }
  }
}
