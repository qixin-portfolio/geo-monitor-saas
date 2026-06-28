import { getPrisma } from "@/lib/prisma"
import { generateTaskDrafts } from "./rules"
import type { GenerateResult } from "./types"

const UNFINISHED_STATUSES = [
  "TODO",
  "BRIEF_READY",
  "DRAFT_READY",
  "REVIEW_NEEDED",
  "APPROVED",
] as const

type CompetitorJson =
  | string
  | {
      name?: unknown
      evidence?: unknown
    }

type EvidenceSpanJson = {
  type: string
  entity: string
  text: string
  start?: number
  end?: number
}

const GENERIC_COMPETITOR_PATTERNS = [
  /适配/,
  /提供/,
  /环保/,
  /选择/,
  /怎么选/,
  /^选/,
  /中小户型/,
  /别墅/,
  /城郊/,
  /复式/,
  /专属/,
  /案例/,
  /服务/,
  /需求/,
  /预算/,
  /设计$/,
]

function isLikelyCompanyName(name: string) {
  if (name.length < 3 || name.length > 15) return false
  if (!/(装饰|装修|设计|家装|工程|整装)$/.test(name)) return false
  return !GENERIC_COMPETITOR_PATTERNS.some((pattern) => pattern.test(name))
}

function toCompetitorNames(value: unknown) {
  if (!Array.isArray(value)) return []

  return Array.from(
    new Set(
      value
        .map((item: CompetitorJson) => {
          if (typeof item === "string") return item
          if (item && typeof item === "object" && typeof item.name === "string") {
            return item.name
          }
          return null
        })
        .filter((item): item is string => Boolean(item?.trim()))
        .map((item) => item.trim())
        .filter(isLikelyCompanyName)
    )
  )
}

function toEvidenceSpans(value: unknown): EvidenceSpanJson[] {
  if (!Array.isArray(value)) return []
  const spans: EvidenceSpanJson[] = []

  for (const item of value) {
    if (!item || typeof item !== "object") continue
    const span = item as Record<string, unknown>
    if (typeof span.text !== "string") continue

    spans.push({
      type: typeof span.type === "string" ? span.type : "unknown",
      entity: typeof span.entity === "string" ? span.entity : "",
      text: span.text,
      start: typeof span.start === "number" ? span.start : undefined,
      end: typeof span.end === "number" ? span.end : undefined,
    })
  }

  return spans
}

export async function generateGeoContentTasksFromRun(input: {
  tenantId: string
  queryRunId: string
}): Promise<GenerateResult> {
  const { tenantId, queryRunId } = input
  const prisma = getPrisma()

  // Load the QueryRun with all needed relations
  const run = await prisma.queryRun.findUnique({
    where: { id: queryRunId },
    include: {
      query: true,
      batch: true,
      analysis: true,
    },
  })

  if (!run) {
    throw new Error(`QueryRun ${queryRunId} not found`)
  }

  if (run.batch.tenantId !== tenantId) {
    throw new Error("权限错误：该监测结果不属于当前租户")
  }

  // If no analysis exists yet, try to generate one
  if (!run.analysis) {
    const { analyzeQueryRun } = await import("@/lib/analysis/analyze-query-run")
    await analyzeQueryRun(queryRunId)

    // Reload to get the analysis
    const refreshed = await prisma.queryRun.findUnique({
      where: { id: queryRunId },
      include: { analysis: true },
    })
    if (!refreshed?.analysis) {
      throw new Error("无法生成分析结果")
    }
  }

  // Load tenant and brand profile
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    include: { brandProfile: true },
  })

  const analysis = await prisma.queryRunAnalysis.findUniqueOrThrow({
    where: { queryRunId },
  })

  const brandName = tenant.brandName || "晟景装饰"
  const region = tenant.region || tenant.brandProfile?.region || "交城"
  const industry = tenant.industry || tenant.brandProfile?.industry || "装修"

  const competitors = toCompetitorNames(analysis.competitorsJson)
  const evidenceSpans = toEvidenceSpans(analysis.evidenceSpansJson)

  const mentionStatus = analysis.mentionStatus || "NONE"

  // Generate task drafts from rules
  const drafts = generateTaskDrafts({
    tenantId,
    queryRunId,
    analysisId: analysis.id,
    sourceQuery: run.query.text,
    sourceProvider: run.provider,
    sourceModel: run.model,
    mentionStatus,
    rankType: analysis.rankType,
    brandMentioned: analysis.brandMentioned,
    brandRank: analysis.brandRank,
    visibilityScore: analysis.visibilityScore,
    parserConfidence: analysis.parserConfidence,
    queryIntentType: run.query.intentType,
    competitors,
    reasonTags: analysis.reasonTags,
    evidenceSpans,
    summary: analysis.summary,
    brandName,
    region,
    industry,
  })

  // Idempotency: one unfinished task per tenant + source query + suggested content type.
  const created: GenerateResult["created"] = []
  const existing: GenerateResult["existing"] = []

  for (const draft of drafts) {
    const found = await prisma.geoContentTask.findFirst({
      where: {
        tenantId,
        type: draft.type,
        status: { in: [...UNFINISHED_STATUSES] },
        OR: [
          { sourceQuery: run.query.text },
          { title: draft.title },
        ],
      },
    })

    if (found) {
      existing.push({ id: found.id, title: found.title, type: found.type })
      continue
    }

    const task = await prisma.geoContentTask.create({
      data: {
        tenantId,
        queryRunId,
        analysisId: analysis.id,
        title: draft.title,
        type: draft.type,
        priority: draft.priority,
        sourceQuery: run.query.text,
        sourceProvider: run.provider,
        sourceModel: run.model,
        sourceReason: draft.sourceReason,
        targetKeyword: draft.targetKeyword,
        targetAudience: draft.targetAudience,
        recommendedAngle: draft.recommendedAngle,
        evidenceJson: draft.evidenceJson,
      },
    })

    created.push({ id: task.id, title: task.title, type: task.type })
  }

  return { created, existing }
}
