"use server"

import type { GeoContentTaskType, Prisma } from "@prisma/client"

import type { ContentBacklogTaskDraft } from "@/lib/evidence/map-repair-task-to-content-task"
import { validateRepairTaskDraft } from "@/lib/evidence/validate-repair-task-draft"
import { getPrisma } from "@/lib/prisma"
import { getOrCreateTenant } from "@/lib/tenant"

const UNFINISHED_STATUSES = [
  "TODO",
  "BRIEF_READY",
  "DRAFT_READY",
  "REVIEW_NEEDED",
  "APPROVED",
] as const

type OwnedContext = {
  queryId?: string
  queryText?: string
  queryRunId?: string
  analysisId?: string
  sourceProvider?: string | null
  sourceModel?: string | null
}

type EvidenceRepairMetadata = {
  taskType: string
  evidenceGap: string
  suggestedPage: string
}

export type CreateEvidenceRepairTaskInput = {
  draft: unknown
  queryId?: string | null
  queryRunId?: string | null
  analysisId?: string | null
}

export type CreateEvidenceRepairTaskResult = {
  success: boolean
  taskId?: string
  duplicate: boolean
  errors: string[]
}

type PrismaClientLike = ReturnType<typeof getPrisma>

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function asString(value: unknown) {
  return typeof value === "string" ? value : ""
}

function getRepairTaskMetadata(value: unknown): EvidenceRepairMetadata {
  if (!isRecord(value)) {
    return { taskType: "", evidenceGap: "", suggestedPage: "" }
  }

  const repairTask = isRecord(value.repairTask) ? value.repairTask : {}
  return {
    taskType: asString(repairTask.taskType),
    evidenceGap: asString(repairTask.evidenceGap ?? value.trigger),
    suggestedPage: asString(repairTask.suggestedPage ?? value.suggestedPage),
  }
}

function buildSafeEvidenceJson(
  value: Prisma.InputJsonValue,
  relatedQuery: string
): Prisma.InputJsonObject {
  if (!isRecord(value)) {
    return {
      source: "evidence_map",
      trigger: "",
      relatedQuery,
      suggestedPage: "",
      nextSteps: [],
      repairTask: {},
    }
  }

  const record = value as Record<string, unknown>
  const repairTask = isRecord(record.repairTask) ? record.repairTask : {}

  return {
    source: "evidence_map",
    trigger: asString(record.trigger),
    relatedQuery,
    suggestedPage: asString(record.suggestedPage),
    nextSteps: Array.isArray(record.nextSteps) ? record.nextSteps : [],
    repairTask: {
      taskType: asString(repairTask.taskType),
      priority: asString(repairTask.priority),
      evidenceGap: asString(repairTask.evidenceGap ?? record.trigger),
      suggestedPage: asString(repairTask.suggestedPage ?? record.suggestedPage),
      expectedImpact: asString(repairTask.expectedImpact),
      effortLevel: asString(repairTask.effortLevel),
      nextSteps: Array.isArray(repairTask.nextSteps) ? repairTask.nextSteps : [],
    },
  }
}

function buildSafeBriefJson(
  value: Prisma.InputJsonValue,
  searchIntent: string
): Prisma.InputJsonObject {
  if (!isRecord(value)) {
    return {
      audience: "",
      searchIntent,
      angle: "",
      differentiationTargets: [],
      forbiddenClaims: [],
      evidenceNeeded: [],
      outline: [],
      internalLinks: [],
      llmsNotes: [],
    }
  }

  const record = value as Record<string, unknown>

  return {
    audience: asString(record.audience),
    searchIntent,
    angle: asString(record.angle),
    differentiationTargets: Array.isArray(record.differentiationTargets)
      ? record.differentiationTargets
      : [],
    forbiddenClaims: Array.isArray(record.forbiddenClaims) ? record.forbiddenClaims : [],
    evidenceNeeded: Array.isArray(record.evidenceNeeded) ? record.evidenceNeeded : [],
    outline: Array.isArray(record.outline) ? record.outline : [],
    internalLinks: Array.isArray(record.internalLinks) ? record.internalLinks : [],
    llmsNotes: Array.isArray(record.llmsNotes) ? record.llmsNotes : [],
  }
}

function applyServerOwnedContext(
  draft: ContentBacklogTaskDraft,
  context: OwnedContext
): ContentBacklogTaskDraft {
  const sourceQuery = context.queryText ?? draft.sourceQuery
  return {
    title: draft.title,
    type: draft.type,
    priority: draft.priority,
    sourceQuery,
    sourceReason: draft.sourceReason,
    targetKeyword: context.queryText ?? draft.targetKeyword,
    targetAudience: draft.targetAudience,
    recommendedAngle: draft.recommendedAngle,
    evidenceJson: buildSafeEvidenceJson(draft.evidenceJson, sourceQuery),
    briefJson: buildSafeBriefJson(draft.briefJson, sourceQuery),
  }
}

async function resolveOwnedContext(
  prisma: PrismaClientLike,
  tenantId: string,
  input: CreateEvidenceRepairTaskInput
): Promise<{ context: OwnedContext; errors: string[] }> {
  const errors: string[] = []
  const context: OwnedContext = {}

  if (input.queryId) {
    const query = await prisma.query.findFirst({
      where: { id: input.queryId, tenantId },
      select: { id: true, text: true },
    })

    if (!query) {
      errors.push("query 不存在或不属于当前租户")
    } else {
      context.queryId = query.id
      context.queryText = query.text
    }
  }

  if (input.queryRunId) {
    const run = await prisma.queryRun.findFirst({
      where: {
        id: input.queryRunId,
        query: { tenantId },
        batch: { tenantId },
      },
      select: {
        id: true,
        queryId: true,
        provider: true,
        model: true,
        query: { select: { id: true, text: true } },
        analysis: { select: { id: true } },
      },
    })

    if (!run) {
      errors.push("queryRun 不存在或不属于当前租户")
    } else if (context.queryId && run.queryId !== context.queryId) {
      errors.push("queryRun 与 queryId 不匹配")
    } else {
      context.queryId = run.queryId
      context.queryText = run.query.text
      context.queryRunId = run.id
      context.analysisId = run.analysis?.id
      context.sourceProvider = run.provider
      context.sourceModel = run.model
    }
  }

  if (input.analysisId) {
    const analysis = await prisma.queryRunAnalysis.findFirst({
      where: {
        id: input.analysisId,
        queryRun: {
          query: { tenantId },
          batch: { tenantId },
        },
      },
      select: {
        id: true,
        queryRunId: true,
        queryRun: {
          select: {
            id: true,
            queryId: true,
            provider: true,
            model: true,
            query: { select: { id: true, text: true } },
          },
        },
      },
    })

    if (!analysis) {
      errors.push("analysis 不存在或不属于当前租户")
    } else if (context.queryRunId && analysis.queryRunId !== context.queryRunId) {
      errors.push("analysis 与 queryRunId 不匹配")
    } else if (context.queryId && analysis.queryRun.queryId !== context.queryId) {
      errors.push("analysis 与 queryId 不匹配")
    } else {
      context.queryId = analysis.queryRun.queryId
      context.queryText = analysis.queryRun.query.text
      context.queryRunId = analysis.queryRunId
      context.analysisId = analysis.id
      context.sourceProvider = analysis.queryRun.provider
      context.sourceModel = analysis.queryRun.model
    }
  }

  return { context, errors }
}

function isDuplicateCandidate(
  candidate: {
    type: GeoContentTaskType
    sourceQuery: string | null
    evidenceJson: Prisma.JsonValue | null
  },
  draft: ContentBacklogTaskDraft
) {
  if (candidate.type !== draft.type) return false
  if ((candidate.sourceQuery ?? "") !== draft.sourceQuery) return false

  const candidateMeta = getRepairTaskMetadata(candidate.evidenceJson)
  const draftMeta = getRepairTaskMetadata(draft.evidenceJson)

  return (
    candidateMeta.taskType === draftMeta.taskType &&
    candidateMeta.evidenceGap === draftMeta.evidenceGap &&
    candidateMeta.suggestedPage === draftMeta.suggestedPage
  )
}

async function findDuplicateTask(
  prisma: PrismaClientLike,
  tenantId: string,
  draft: ContentBacklogTaskDraft
) {
  const candidates = await prisma.geoContentTask.findMany({
    where: {
      tenantId,
      type: draft.type,
      status: { in: [...UNFINISHED_STATUSES] },
      sourceQuery: draft.sourceQuery,
    },
    select: {
      id: true,
      title: true,
      type: true,
      sourceQuery: true,
      evidenceJson: true,
    },
    take: 20,
  })

  return candidates.find((candidate) => isDuplicateCandidate(candidate, draft)) ?? null
}

export async function createEvidenceRepairTask(
  input: CreateEvidenceRepairTaskInput
): Promise<CreateEvidenceRepairTaskResult> {
  let tenant: { id: string } | null = null

  try {
    tenant = await getOrCreateTenant()
  } catch {
    return {
      success: false,
      duplicate: false,
      errors: ["未登录或无法确认当前租户"],
    }
  }

  if (!tenant?.id) {
    return {
      success: false,
      duplicate: false,
      errors: ["未登录或无法确认当前租户"],
    }
  }

  const validation = validateRepairTaskDraft(input.draft)
  if (!validation.valid || !validation.sanitizedDraft) {
    return {
      success: false,
      duplicate: false,
      errors: validation.errors,
    }
  }

  const prisma = getPrisma()
  const { context, errors } = await resolveOwnedContext(prisma, tenant.id, input)

  if (errors.length > 0) {
    return {
      success: false,
      duplicate: false,
      errors,
    }
  }

  const draft = applyServerOwnedContext(validation.sanitizedDraft, context)
  const duplicate = await findDuplicateTask(prisma, tenant.id, draft)

  if (duplicate) {
    return {
      success: true,
      taskId: duplicate.id,
      duplicate: true,
      errors: [],
    }
  }

  const created = await prisma.geoContentTask.create({
    data: {
      tenantId: tenant.id,
      queryRunId: context.queryRunId,
      analysisId: context.analysisId,
      title: draft.title,
      type: draft.type,
      priority: draft.priority,
      status: "TODO",
      sourceQuery: draft.sourceQuery,
      sourceProvider: context.sourceProvider,
      sourceModel: context.sourceModel,
      sourceReason: draft.sourceReason,
      targetKeyword: draft.targetKeyword,
      targetAudience: draft.targetAudience,
      recommendedAngle: draft.recommendedAngle,
      evidenceJson: draft.evidenceJson,
      briefJson: draft.briefJson,
    },
    select: {
      id: true,
    },
  })

  return {
    success: true,
    taskId: created.id,
    duplicate: false,
    errors: [],
  }
}
