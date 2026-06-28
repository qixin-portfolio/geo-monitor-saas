import type { Prisma } from "@prisma/client"

import { getPrisma } from "@/lib/prisma"

import { buildMonitoringPrompt } from "./build-monitoring-prompt"
import { getMonitoringConfig } from "./config"
import { parseMonitoringOutput } from "./parse-monitoring-output"
import type { MonitoringProvider } from "./provider"

type RunQueryInput = {
  query: { id: string; text: string }
  tenant: {
    brandName: string | null
    industry: string | null
    region: string | null
    brandProfile?: { brandAliases: string[] } | null
  }
  provider: MonitoringProvider
  queryRunId?: string
  prompt?: string
}

function toJsonValue(value: unknown) {
  if (value === undefined || value === null) return undefined
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

function getErrorDetail(error: unknown) {
  if (!(error instanceof Error)) {
    return {
      message: "unknown-provider-error",
      code: null,
      httpStatus: null,
    }
  }

  const detail = error as Error & {
    code?: string
    status?: number
    response?: { status?: number; data?: unknown }
  }

  return {
    message: error.message,
    code: detail.code ?? null,
    httpStatus: detail.status ?? detail.response?.status ?? null,
    rawResponseJson: detail.response?.data,
  }
}

async function nextAttemptNo(queryRunId: string) {
  const prisma = getPrisma()
  return (
    (await prisma.providerAttempt.count({
      where: { queryRunId },
    })) + 1
  )
}

async function createProviderAttempt({
  queryRunId,
  data,
}: {
  queryRunId: string | undefined
  data: Omit<Prisma.ProviderAttemptUncheckedCreateInput, "id" | "queryRunId" | "attemptNo">
}) {
  if (!queryRunId) return
  const prisma = getPrisma()
  await prisma.providerAttempt.create({
    data: {
      queryRunId,
      attemptNo: await nextAttemptNo(queryRunId),
      ...data,
    },
  })
}

export async function runQuery({
  query,
  tenant,
  provider,
  queryRunId,
  prompt: inputPrompt,
}: RunQueryInput) {
  const brandName = tenant.brandName?.trim() || "未设置品牌"
  const prompt =
    inputPrompt ??
    buildMonitoringPrompt({
      queryText: query.text,
    })
  const config = getMonitoringConfig()
  const model = config.model
  const rawRequestJson = {
    provider: config.provider,
    model,
    prompt,
  }
  const attemptStartedAt = Date.now()

  try {
    const result = await provider.call({
      prompt,
      model,
    })

    const parsed = parseMonitoringOutput({
      brandName,
      brandAliases: tenant.brandProfile?.brandAliases ?? [],
      answer: result.output,
    })

    await createProviderAttempt({
      queryRunId,
      data: {
        provider: result.provider,
        model: result.model,
        httpStatus: result.httpStatus ?? null,
        latencyMs: result.durationMs ?? Date.now() - attemptStartedAt,
        inputTokens: result.inputTokens ?? null,
        outputTokens: result.outputTokens ?? null,
        totalTokens: result.totalTokens ?? null,
        rawRequestJson: toJsonValue(result.rawRequestJson ?? rawRequestJson),
        rawResponseJson: toJsonValue(result.rawResponseJson),
      },
    })

    return {
      status: "success" as const,
      provider: result.provider,
      model: result.model,
      prompt,
      rawOutput: result.output,
      mentioned: parsed.mentioned,
      rank: parsed.rank,
      competitors: parsed.competitors,
      notes: parsed.notes,
      errorMessage: null,
    }
  } catch (error) {
    const detail = getErrorDetail(error)
    await createProviderAttempt({
      queryRunId,
      data: {
        provider: config.provider,
        model,
        httpStatus: detail.httpStatus,
        errorCode: detail.code,
        errorMessage: detail.message,
        latencyMs: Date.now() - attemptStartedAt,
        rawRequestJson: toJsonValue(rawRequestJson),
        rawResponseJson: toJsonValue(detail.rawResponseJson),
      },
    })

    return {
      status: "failed" as const,
      provider: config.provider,
      model,
      prompt,
      rawOutput: null,
      mentioned: false,
      rank: null,
      competitors: [],
      notes: null,
      errorMessage: detail.message,
    }
  }
}
