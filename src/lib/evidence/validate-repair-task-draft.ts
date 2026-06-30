import type { GeoContentTaskType, Prisma } from "@prisma/client"

import type { ContentBacklogTaskDraft } from "./map-repair-task-to-content-task"
import type { EvidenceGap, EvidencePriority } from "./extract-evidence-map"
import type { RepairTaskType } from "./map-evidence-gap-to-repair-task"

export type RepairTaskDraftValidationResult = {
  valid: boolean
  errors: string[]
  sanitizedDraft: ContentBacklogTaskDraft | null
}

const ALLOWED_CONTENT_TYPES: GeoContentTaskType[] = [
  "ARTICLE",
  "FAQ",
  "CASE_PAGE",
  "COMPARISON",
  "LOCAL_SERVICE_PAGE",
  "LLMSTXT",
  "SCHEMA",
  "SOCIAL_POST",
]

const ALLOWED_REPAIR_TASK_TYPES: RepairTaskType[] = [
  "page_update",
  "new_page",
  "faq_addition",
  "schema_fix",
  "third_party_profile",
  "review_collection",
  "authority_building",
  "sentiment_defense",
  "competitor_counter",
]

const ALLOWED_EVIDENCE_GAPS: EvidenceGap[] = [
  "competitor_evidence_advantage",
  "missing_citable_brand_evidence",
  "weak_brand_definition",
  "no_major_gap",
]

const ALLOWED_EVIDENCE_PRIORITIES: EvidencePriority[] = ["P0", "P1", "P2"]
const ALLOWED_CONTENT_PRIORITIES = [90, 70, 45] as const

const TITLE_MAX = 120
const SHORT_TEXT_MAX = 160
const LONG_TEXT_MAX = 1_200
const NEXT_STEP_MAX = 160
const NEXT_STEP_COUNT_MAX = 6
const FALLBACK_QUERY = "待补充原始 query"

const RAW_RESPONSE_KEYS = [
  "raw",
  "rawAnswer",
  "rawApiResponse",
  "rawOutput",
  "rawResponse",
  "rawResponseJson",
  "rawRequestJson",
  "fullResponse",
  "apiResponse",
  "originalResponse",
  "prompt",
]

const SENSITIVE_KEYS = [
  "apiKey",
  "authorization",
  "bearer",
  "cookie",
  "databaseUrl",
  "email",
  "password",
  "phone",
  "privateKey",
  "secret",
  "session",
  "token",
  "webhookSecret",
]

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
const PHONE_PATTERN = /(?:\+?86[-\s]?)?1[3-9]\d{9}/
const SECRET_VALUE_PATTERN =
  /(sk_(live|test)|pk_(live|test)|clerk_(secret|publishable)|DATABASE_URL=|postgres(?:ql)?:\/\/|Bearer\s+[A-Za-z0-9._-]{12,})/i

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function normalizeKey(value: string) {
  return value.replace(/[-_\s]/g, "").toLowerCase()
}

function hasKeyMatch(key: string, candidates: string[]) {
  const normalized = normalizeKey(key)
  return candidates.some((candidate) => normalized.includes(normalizeKey(candidate)))
}

function findUnsafePath(value: unknown, path = "draft"): string | null {
  if (typeof value === "string") {
    if (
      EMAIL_PATTERN.test(value) ||
      PHONE_PATTERN.test(value) ||
      SECRET_VALUE_PATTERN.test(value)
    ) {
      return path
    }
    return null
  }

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = findUnsafePath(value[index], `${path}[${index}]`)
      if (found) return found
    }
    return null
  }

  if (!isRecord(value)) return null

  for (const [key, nested] of Object.entries(value)) {
    if (hasKeyMatch(key, RAW_RESPONSE_KEYS)) return `${path}.${key}`
    if (hasKeyMatch(key, SENSITIVE_KEYS)) return `${path}.${key}`
    const found = findUnsafePath(nested, `${path}.${key}`)
    if (found) return found
  }

  return null
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

function truncate(value: string, max: number) {
  return value.length > max ? value.slice(0, max).trimEnd() : value
}

function sanitizeShort(value: unknown, fallback = "") {
  return truncate(asString(value, fallback), SHORT_TEXT_MAX)
}

function sanitizeLong(value: unknown, fallback = "") {
  return truncate(asString(value, fallback), LONG_TEXT_MAX)
}

function isAllowedContentPriority(value: unknown): value is typeof ALLOWED_CONTENT_PRIORITIES[number] {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    ALLOWED_CONTENT_PRIORITIES.includes(value as typeof ALLOWED_CONTENT_PRIORITIES[number])
  )
}

function sanitizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => sanitizeShort(item))
    .filter(Boolean)
    .slice(0, NEXT_STEP_COUNT_MAX)
}

function sanitizeNextSteps(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => truncate(asString(item), NEXT_STEP_MAX))
    .filter(Boolean)
    .slice(0, NEXT_STEP_COUNT_MAX)
}

function sanitizeJsonObject(value: unknown): Prisma.InputJsonObject {
  return isRecord(value) ? (value as Prisma.InputJsonObject) : {}
}

function repairTaskMetadata(value: Prisma.InputJsonObject): Record<string, unknown> {
  const repairTask = value.repairTask
  return isRecord(repairTask) ? (repairTask as Record<string, unknown>) : {}
}

function validateMetadata(evidenceJson: Prisma.InputJsonObject, errors: string[]) {
  const repairTask = repairTaskMetadata(evidenceJson)
  const taskType = repairTask.taskType
  const priority = repairTask.priority
  const evidenceGap = repairTask.evidenceGap ?? evidenceJson.trigger

  if (taskType && !ALLOWED_REPAIR_TASK_TYPES.includes(taskType as RepairTaskType)) {
    errors.push("repairTask.taskType 不在白名单内")
  }

  if (priority && !ALLOWED_EVIDENCE_PRIORITIES.includes(priority as EvidencePriority)) {
    errors.push("repairTask.priority 不在白名单内")
  }

  if (evidenceGap && !ALLOWED_EVIDENCE_GAPS.includes(evidenceGap as EvidenceGap)) {
    errors.push("evidenceGap 不在白名单内")
  }
}

function sanitizeEvidenceJson(
  value: Prisma.InputJsonObject,
  relatedQuery: string
): Prisma.InputJsonObject {
  const repairTask = repairTaskMetadata(value)
  const nextSteps = sanitizeNextSteps(value.nextSteps ?? repairTask.nextSteps)

  return {
    source: sanitizeShort(value.source, "evidence_map"),
    trigger: sanitizeShort(value.trigger),
    relatedQuery: sanitizeShort(value.relatedQuery, relatedQuery),
    suggestedPage: sanitizeShort(value.suggestedPage),
    nextSteps,
    repairTask: {
      taskType: sanitizeShort(repairTask.taskType),
      priority: sanitizeShort(repairTask.priority),
      evidenceGap: sanitizeShort(repairTask.evidenceGap ?? value.trigger),
      suggestedPage: sanitizeShort(repairTask.suggestedPage ?? value.suggestedPage),
      expectedImpact: sanitizeLong(repairTask.expectedImpact),
      effortLevel: sanitizeShort(repairTask.effortLevel),
      nextSteps,
    },
  }
}

function sanitizeBriefJson(
  value: Prisma.InputJsonObject,
  relatedQuery: string
): Prisma.InputJsonObject {
  return {
    audience: sanitizeShort(value.audience),
    searchIntent: sanitizeShort(value.searchIntent, relatedQuery),
    angle: sanitizeShort(value.angle),
    differentiationTargets: sanitizeStringArray(value.differentiationTargets),
    forbiddenClaims: sanitizeStringArray(value.forbiddenClaims),
    evidenceNeeded: sanitizeStringArray(value.evidenceNeeded),
    outline: sanitizeNextSteps(value.outline),
    internalLinks: sanitizeStringArray(value.internalLinks),
    llmsNotes: sanitizeStringArray(value.llmsNotes),
  }
}

export function validateRepairTaskDraft(input: unknown): RepairTaskDraftValidationResult {
  const errors: string[] = []

  if (!isRecord(input)) {
    return {
      valid: false,
      errors: ["draft 必须是对象"],
      sanitizedDraft: null,
    }
  }

  const unsafePath = findUnsafePath(input)
  if (unsafePath) {
    errors.push(`draft 包含禁止入库的 raw response、secret 或隐私字段：${unsafePath}`)
  }

  const type = input.type
  const contentType = ALLOWED_CONTENT_TYPES.includes(type as GeoContentTaskType)
    ? (type as GeoContentTaskType)
    : null
  const contentPriority = isAllowedContentPriority(input.priority)
    ? input.priority
    : null

  if (!contentType) {
    errors.push("type 不在 GeoContentTaskType 白名单内")
  }

  if (contentPriority === null) {
    errors.push("invalid priority：priority 不在白名单内")
  }

  const evidenceJson = sanitizeJsonObject(input.evidenceJson)
  const briefJson = sanitizeJsonObject(input.briefJson)
  validateMetadata(evidenceJson, errors)

  if (errors.length > 0 || !contentType || contentPriority === null) {
    return {
      valid: false,
      errors,
      sanitizedDraft: null,
    }
  }

  const relatedQuery = sanitizeShort(input.sourceQuery, FALLBACK_QUERY)
  const sanitizedEvidenceJson = sanitizeEvidenceJson(evidenceJson, relatedQuery)

  const sanitizedDraft: ContentBacklogTaskDraft = {
    title: truncate(asString(input.title, "未命名修复任务"), TITLE_MAX),
    type: contentType,
    priority: contentPriority,
    sourceQuery: relatedQuery,
    sourceReason: sanitizeLong(input.sourceReason),
    targetKeyword: sanitizeShort(input.targetKeyword, relatedQuery),
    targetAudience: sanitizeShort(input.targetAudience, "负责官网、内容和 GEO 修复的运营/市场人员"),
    recommendedAngle: sanitizeLong(input.recommendedAngle),
    evidenceJson: sanitizedEvidenceJson,
    briefJson: sanitizeBriefJson(briefJson, relatedQuery),
  }

  return {
    valid: true,
    errors: [],
    sanitizedDraft,
  }
}
