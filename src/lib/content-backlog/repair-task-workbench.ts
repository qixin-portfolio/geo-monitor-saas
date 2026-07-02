export type RepairTaskWorkbenchType =
  | "FAQ"
  | "CASE_STUDY"
  | "QUALIFICATION"
  | "SERVICE_PAGE"
  | "SCHEMA"
  | "COMPARISON"
  | "SOURCE_BUILDING"
  | "CONTENT_UPDATE"

export type RepairTaskRiskLevel = "GREEN" | "YELLOW" | "RED"

export type RepairTaskWorkbenchInput = {
  title?: string | null
  type?: string | null
  priority?: number | null
  status?: string | null
  sourceQuery?: string | null
  sourceReason?: string | null
  targetKeyword?: string | null
  recommendedAngle?: string | null
  evidenceJson?: unknown
  briefJson?: unknown
  queryRunId?: string | null
  analysisId?: string | null
}

export type RepairTaskEvidenceSummary = {
  relatedQuery: string
  evidenceGap: string
  suggestedPage: string
  nextSteps: string[]
}

type RepairTaskMetadata = {
  taskType: string
  evidenceGap: string
  suggestedPage: string
  expectedImpact: string
  nextSteps: string[]
  relatedQuery: string
}

export type RepairTaskWorkbenchViewModel = {
  type: RepairTaskWorkbenchType
  riskLevel: RepairTaskRiskLevel
  riskReason: string
  evidenceSummary: RepairTaskEvidenceSummary
  whyFix: string
  howToFix: string[]
  retestPlaceholder: string
}

export const REPAIR_TASK_TYPE_LABELS: Record<RepairTaskWorkbenchType, string> = {
  FAQ: "FAQ",
  CASE_STUDY: "案例页",
  QUALIFICATION: "资质页",
  SERVICE_PAGE: "服务页",
  SCHEMA: "Schema",
  COMPARISON: "对比页",
  SOURCE_BUILDING: "外部来源建设",
  CONTENT_UPDATE: "内容更新",
}

export const REPAIR_TASK_RISK_LABELS: Record<RepairTaskRiskLevel, string> = {
  GREEN: "绿色",
  YELLOW: "黄色",
  RED: "红色",
}

const REPAIR_TASK_TYPE_BY_METADATA: Record<string, RepairTaskWorkbenchType> = {
  faq_addition: "FAQ",
  review_collection: "CASE_STUDY",
  authority_building: "SOURCE_BUILDING",
  third_party_profile: "SOURCE_BUILDING",
  page_update: "CONTENT_UPDATE",
  new_page: "SERVICE_PAGE",
  schema_fix: "SCHEMA",
  competitor_counter: "COMPARISON",
  sentiment_defense: "FAQ",
}

const REPAIR_TASK_TYPE_BY_CONTENT_TYPE: Record<string, RepairTaskWorkbenchType> = {
  FAQ: "FAQ",
  CASE_PAGE: "CASE_STUDY",
  LOCAL_SERVICE_PAGE: "SERVICE_PAGE",
  SCHEMA: "SCHEMA",
  COMPARISON: "COMPARISON",
  ARTICLE: "CONTENT_UPDATE",
  LLMSTXT: "CONTENT_UPDATE",
  SOCIAL_POST: "CONTENT_UPDATE",
}

const RED_RISK_PATTERNS = [
  "攻击竞品",
  "伪造评价",
  "虚构案例",
  "批量灌水",
  "隐藏文本",
  "提示词注入",
  "RAG 投毒",
  "rag 投毒",
]

const YELLOW_RISK_PATTERNS = [
  "竞品",
  "客户评价",
  "排名",
  "效果承诺",
  "第三方数据",
  "对比",
  "口碑",
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.map((item) => asString(item)).filter(Boolean)
}

function getRepairTaskMetadata(value: unknown): RepairTaskMetadata {
  if (!isRecord(value)) {
    return {
      taskType: "",
      evidenceGap: "",
      suggestedPage: "",
      expectedImpact: "",
      nextSteps: [],
      relatedQuery: "",
    }
  }

  const repairTask = isRecord(value.repairTask) ? value.repairTask : {}
  return {
    taskType: asString(repairTask.taskType),
    evidenceGap: asString(repairTask.evidenceGap ?? value.trigger),
    suggestedPage: asString(repairTask.suggestedPage ?? value.suggestedPage),
    expectedImpact: asString(repairTask.expectedImpact),
    nextSteps: asStringArray(repairTask.nextSteps ?? value.nextSteps),
    relatedQuery: asString(value.relatedQuery),
  }
}

function getBriefEvidenceNeeded(value: unknown) {
  if (!isRecord(value)) return []
  return asStringArray(value.evidenceNeeded)
}

function buildSearchText(task: RepairTaskWorkbenchInput) {
  const metadata = getRepairTaskMetadata(task.evidenceJson)
  const briefEvidenceNeeded = getBriefEvidenceNeeded(task.briefJson)

  return [
    task.title,
    task.type,
    task.sourceQuery,
    task.sourceReason,
    task.targetKeyword,
    task.recommendedAngle,
    metadata.taskType,
    metadata.evidenceGap,
    metadata.suggestedPage,
    metadata.expectedImpact,
    ...metadata.nextSteps,
    ...briefEvidenceNeeded,
  ]
    .map((item) => (typeof item === "string" ? item : ""))
    .join(" ")
}

export function deriveRepairTaskType(task: RepairTaskWorkbenchInput): RepairTaskWorkbenchType {
  const metadata = getRepairTaskMetadata(task.evidenceJson)
  const metadataType = REPAIR_TASK_TYPE_BY_METADATA[metadata.taskType]
  if (metadataType) return metadataType

  const text = buildSearchText(task)
  if (/资质|证书|认证|许可证|qualification/i.test(text)) return "QUALIFICATION"

  return REPAIR_TASK_TYPE_BY_CONTENT_TYPE[task.type ?? ""] ?? "CONTENT_UPDATE"
}

export function deriveRepairTaskRiskLevel(task: RepairTaskWorkbenchInput): RepairTaskRiskLevel {
  const text = buildSearchText(task)
  if (RED_RISK_PATTERNS.some((pattern) => text.includes(pattern))) return "RED"

  const workbenchType = deriveRepairTaskType(task)
  if (workbenchType === "COMPARISON") return "YELLOW"
  if (YELLOW_RISK_PATTERNS.some((pattern) => text.includes(pattern))) return "YELLOW"

  return "GREEN"
}

export function getRepairTaskRiskReason(task: RepairTaskWorkbenchInput) {
  const riskLevel = deriveRepairTaskRiskLevel(task)
  const workbenchType = deriveRepairTaskType(task)

  if (riskLevel === "RED") {
    return "包含攻击竞品、伪造评价、虚构案例、批量灌水、隐藏文本、提示词注入或 RAG 投毒等高风险方向，必须人工阻断。"
  }

  if (riskLevel === "YELLOW") {
    return "涉及竞品对比、客户评价、排名、效果承诺或第三方数据，必须补足证据并由人工确认措辞。"
  }

  if (workbenchType === "SCHEMA") {
    return "属于结构化信息补强，风险较低，但仍需要使用真实页面和真实业务信息。"
  }

  return "属于补真实 FAQ、案例、资质、服务说明或内容更新的低风险修复，仍需人工确认后执行。"
}

export function getRepairTaskEvidenceSummary(
  task: RepairTaskWorkbenchInput
): RepairTaskEvidenceSummary {
  const metadata = getRepairTaskMetadata(task.evidenceJson)
  return {
    relatedQuery: metadata.relatedQuery || task.sourceQuery || "暂未关联 query",
    evidenceGap: metadata.evidenceGap || "暂未记录 evidence gap",
    suggestedPage: metadata.suggestedPage || "暂未指定页面",
    nextSteps: metadata.nextSteps.length
      ? metadata.nextSteps
      : ["补充可验证证据。", "完成后在下一轮监测中复测。"],
  }
}

export function buildRepairTaskWorkbenchViewModel(
  task: RepairTaskWorkbenchInput
): RepairTaskWorkbenchViewModel {
  const evidenceSummary = getRepairTaskEvidenceSummary(task)
  const briefEvidenceNeeded = getBriefEvidenceNeeded(task.briefJson)

  return {
    type: deriveRepairTaskType(task),
    riskLevel: deriveRepairTaskRiskLevel(task),
    riskReason: getRepairTaskRiskReason(task),
    evidenceSummary,
    whyFix:
      task.sourceReason ||
      `这条任务来自“${evidenceSummary.relatedQuery}”的证据缺口，需要补足可被 AI 引用的内容依据。`,
    howToFix: briefEvidenceNeeded.length ? briefEvidenceNeeded : evidenceSummary.nextSteps,
    retestPlaceholder: "后续版本将接入修复前后复测入口，本轮只保留占位，不自动执行复测。",
  }
}
