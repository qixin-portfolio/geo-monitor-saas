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

export type RepairTaskAnalysisInput = {
  mentionStatus?: string | null
  rankType?: string | null
  impactLevel?: string | null
  visibilityScore?: number | null
  summary?: string | null
  competitorsJson?: unknown
  evidenceSpansJson?: unknown
}

export type RepairTaskQueryRunInput = {
  provider?: string | null
  model?: string | null
  rawOutput?: string | null
  query?: {
    text?: string | null
    platform?: string | null
  } | null
}

export type RepairTaskDetailViewModel = RepairTaskWorkbenchViewModel & {
  oneLineSummary: string
  queryText: string
  platformLabel: string
  evidenceBasisSummary: string
  answerSummary: string
  brandMentionSummary: string
  competitorSummary: string
  recommendedAction: {
    angle: string
    outputType: string
    executionHint: string
    acceptanceCriteria: string[]
  }
  riskReview: {
    level: RepairTaskRiskLevel
    reason: string
    handling: string
  }
  retestPlan: {
    beforeState: string
    pendingState: string
    metrics: string[]
    reportSummary: string
  }
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

function summarizeText(value: unknown, fallback: string) {
  const text = asString(value)
  if (!text) return fallback
  const summary = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(" ")
  if (!summary) return fallback
  return summary.length > 220 ? `${summary.slice(0, 220)}...` : summary
}

function getCompetitorNames(value: unknown) {
  if (!Array.isArray(value)) return []

  return Array.from(
    new Set(
      value
        .map((item) => {
          if (typeof item === "string") return item.trim()
          if (isRecord(item)) return asString(item.name)
          return ""
        })
        .filter(Boolean)
    )
  )
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

export function formatRepairTaskEvidenceBasis({
  task,
  queryRun,
  analysis,
}: {
  task: RepairTaskWorkbenchInput
  queryRun?: RepairTaskQueryRunInput | null
  analysis?: RepairTaskAnalysisInput | null
}) {
  const evidenceSummary = getRepairTaskEvidenceSummary(task)
  const sourceReason = asString(task.sourceReason)
  const queryText = asString(queryRun?.query?.text) || evidenceSummary.relatedQuery
  const analysisSummary = asString(analysis?.summary)

  return (
    sourceReason ||
    analysisSummary ||
    `这条任务来自“${queryText}”的证据缺口：${evidenceSummary.evidenceGap}。`
  )
}

export function formatRepairTaskRecommendedAction(task: RepairTaskWorkbenchInput) {
  const workbenchType = deriveRepairTaskType(task)
  const evidenceSummary = getRepairTaskEvidenceSummary(task)
  const briefEvidenceNeeded = getBriefEvidenceNeeded(task.briefJson)
  const angle = asString(task.recommendedAngle) || `围绕“${evidenceSummary.relatedQuery}”补齐可被 AI 理解和引用的证据。`
  const outputType = REPAIR_TASK_TYPE_LABELS[workbenchType]
  const executionHint = getRepairTaskExecutionHint(task)
  const acceptanceCriteria = getRepairTaskAcceptanceCriteria(task)

  return {
    angle,
    outputType,
    executionHint,
    acceptanceCriteria: acceptanceCriteria.length
      ? acceptanceCriteria
      : briefEvidenceNeeded.length
        ? briefEvidenceNeeded
        : ["页面包含真实证据。", "页面表达不夸大。", "后续可以基于同一 query 复测。"],
  }
}

export function formatRepairTaskRetestPlaceholder({
  task,
  analysis,
}: {
  task: RepairTaskWorkbenchInput
  analysis?: RepairTaskAnalysisInput | null
}) {
  const visibility = typeof analysis?.visibilityScore === "number"
    ? `${Math.round(analysis.visibilityScore)} 分`
    : "暂未识别"
  const mention = analysis?.mentionStatus === "RECOMMENDED"
    ? "已推荐"
    : analysis?.mentionStatus === "MENTIONED"
      ? "已提及但未明确推荐"
      : "未形成稳定推荐"

  return {
    beforeState: `修复前：${mention}，可见度 ${visibility}。`,
    pendingState: "待复测：内容更新后，使用同一 query 对比下一轮 AI 回答。",
    metrics: [
      "AI 是否提及品牌",
      "AI 是否推荐品牌",
      "引用源是否变化",
      "情感是否改善",
    ],
    reportSummary: `报告占位：后续将基于“${getRepairTaskEvidenceSummary(task).relatedQuery}”记录修复前后变化，本轮不生成 PDF。`,
  }
}

export function getRepairTaskExecutionHint(task: RepairTaskWorkbenchInput) {
  const workbenchType = deriveRepairTaskType(task)

  if (workbenchType === "FAQ") {
    return "建议补充一段可被 AI 理解的 FAQ，并明确服务范围、案例依据和更新时间。"
  }

  if (workbenchType === "CASE_STUDY") {
    return "建议补充真实案例页，包含问题背景、执行过程、结果证据和可验证细节。"
  }

  if (workbenchType === "QUALIFICATION") {
    return "建议补充资质、认证、许可证或权威背书，并标明来源与有效期。"
  }

  if (workbenchType === "SCHEMA") {
    return "建议补充结构化数据，优先覆盖 Organization、LocalBusiness、FAQ 或服务信息。"
  }

  if (workbenchType === "COMPARISON") {
    return "建议只做基于事实证据的对比，避免攻击竞品、夸大排名或做无法证明的效果承诺。"
  }

  if (workbenchType === "SOURCE_BUILDING") {
    return "建议补充可信来源、第三方资料或权威引用，确保来源真实且可追溯。"
  }

  return "建议更新现有页面，补充真实证据、清晰服务说明、内链和更新时间。"
}

export function getRepairTaskAcceptanceCriteria(task: RepairTaskWorkbenchInput) {
  const workbenchType = deriveRepairTaskType(task)
  const base = [
    "内容只使用真实、可验证的信息。",
    "不包含 raw response、prompt、token、cookie、secret 或客户隐私。",
  ]

  if (workbenchType === "COMPARISON") {
    return [
      ...base,
      "对比结论有明确证据来源。",
      "没有攻击竞品或伪造评价。",
    ]
  }

  if (workbenchType === "SCHEMA") {
    return [
      ...base,
      "结构化字段与页面可见内容一致。",
      "后续可用同一 query 复测 AI 是否更容易引用该页面。",
    ]
  }

  return [
    ...base,
    "页面能回答关联 query 的核心问题。",
    "后续可用同一 query 复测品牌提及和推荐状态。",
  ]
}

export function getRepairTaskRiskHandling(task: RepairTaskWorkbenchInput) {
  const riskLevel = deriveRepairTaskRiskLevel(task)

  if (riskLevel === "RED") {
    return "禁止直接执行。只能记录风险，拆出人工审查或修正任务，不允许自动发布。"
  }

  if (riskLevel === "YELLOW") {
    return "需要补证据或人工审核后再进入内容制作，不能直接发布。"
  }

  return "可以进入正常内容制作，但仍需保留人工确认和后续复测。"
}

export function buildRepairTaskDetailViewModel({
  task,
  queryRun,
  analysis,
}: {
  task: RepairTaskWorkbenchInput
  queryRun?: RepairTaskQueryRunInput | null
  analysis?: RepairTaskAnalysisInput | null
}): RepairTaskDetailViewModel {
  const base = buildRepairTaskWorkbenchViewModel(task)
  const queryText = asString(queryRun?.query?.text) || base.evidenceSummary.relatedQuery
  const platformLabel = asString(queryRun?.query?.platform) || asString(queryRun?.provider) || "暂未记录平台"
  const competitors = getCompetitorNames(analysis?.competitorsJson)
  const answerSummary = summarizeText(
    analysis?.summary || queryRun?.rawOutput,
    "这条任务还没有可读的 AI 回答摘要。"
  )
  const mentionStatus = analysis?.mentionStatus
  const brandMentionSummary = mentionStatus === "RECOMMENDED"
    ? "AI 已推荐品牌。"
    : mentionStatus === "MENTIONED"
      ? "AI 已提及品牌，但还没有明确推荐。"
      : "AI 尚未稳定提及或推荐品牌。"

  return {
    ...base,
    oneLineSummary: `这条任务来自一次 AI 问答监测。AI 在“${queryText}”下证据不足，因此系统建议补充对应证据。`,
    queryText,
    platformLabel,
    evidenceBasisSummary: formatRepairTaskEvidenceBasis({ task, queryRun, analysis }),
    answerSummary,
    brandMentionSummary,
    competitorSummary: competitors.length
      ? `识别到竞品：${competitors.slice(0, 5).join("、")}。`
      : "暂未识别明确竞品。",
    recommendedAction: formatRepairTaskRecommendedAction(task),
    riskReview: {
      level: base.riskLevel,
      reason: base.riskReason,
      handling: getRepairTaskRiskHandling(task),
    },
    retestPlan: formatRepairTaskRetestPlaceholder({ task, analysis }),
  }
}
