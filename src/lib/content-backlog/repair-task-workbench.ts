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

export type RepairTaskWorkflowStatus =
  | "DRAFT"
  | "READY"
  | "NEEDS_REVIEW"
  | "IN_PROGRESS"
  | "PUBLISHED"
  | "RETEST_PENDING"
  | "IMPROVED"
  | "NO_CHANGE"
  | "BLOCKED"
  | "REJECTED"

export type RepairTaskLifecycleStep = {
  status: RepairTaskWorkflowStatus
  label: string
  description: string
  state: "completed" | "current" | "pending" | "blocked"
}

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
    summary: string
    executionDecision: string
    requiredEvidence: string[]
    prohibitedActions: string[]
    humanGateNotice: string
  }
  workflow: {
    status: RepairTaskWorkflowStatus
    label: string
    description: string
    nextAction: string
    humanGateRequired: boolean
    canRetest: boolean
    canReport: boolean
    warning: string
    steps: RepairTaskLifecycleStep[]
    safetyNotice: string
  }
  retestPlan: {
    beforeState: string
    pendingState: string
    metrics: string[]
    retestGoals: string[]
    observationMetrics: string[]
    improvementCriteria: string[]
    noChangeCriteria: string[]
    riskCriteria: string[]
    statusLabel: string
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

const RISK_LEVELS = ["GREEN", "YELLOW", "RED"] as const

const WORKFLOW_STATUSES = [
  "DRAFT",
  "READY",
  "NEEDS_REVIEW",
  "IN_PROGRESS",
  "PUBLISHED",
  "RETEST_PENDING",
  "IMPROVED",
  "NO_CHANGE",
  "BLOCKED",
  "REJECTED",
] as const

const REPAIR_TASK_STATUS_LABELS: Record<RepairTaskWorkflowStatus, string> = {
  DRAFT: "草稿",
  READY: "可执行",
  NEEDS_REVIEW: "需审核",
  IN_PROGRESS: "处理中",
  PUBLISHED: "已发布",
  RETEST_PENDING: "待复测",
  IMPROVED: "复测改善",
  NO_CHANGE: "复测暂无变化",
  BLOCKED: "阻塞",
  REJECTED: "已拒绝",
}

const REPAIR_TASK_STATUS_DESCRIPTIONS: Record<RepairTaskWorkflowStatus, string> = {
  DRAFT: "任务刚进入修复池，还需要确认证据、风险和建议产出物。",
  READY: "任务证据和风险较清楚，可以进入人工内容制作，但不代表自动执行。",
  NEEDS_REVIEW: "任务涉及证据、措辞或风险判断，需要人工审核后再决定是否推进。",
  IN_PROGRESS: "任务已进入人工处理阶段，下一步是完成内容制作并检查事实来源。",
  PUBLISHED: "内容已完成发布或导出记录，下一步应准备同一 query 的人工复测。",
  RETEST_PENDING: "任务已具备复测条件，等待人工使用同一 query 对比修复前后变化。",
  IMPROVED: "复测显示方向有改善，可以整理给老板看的摘要，但仍需人工复核。",
  NO_CHANGE: "复测暂无明显变化，需要判断是否补更多证据、调整页面或延后观察。",
  BLOCKED: "当前状态无法安全推进，可能缺少字段、状态未知或风险没有被解释清楚。",
  REJECTED: "任务已被跳过或拒绝，不应继续执行，只能保留记录或重新创建更安全的任务。",
}

const WORKFLOW_STATUS_ORDER: RepairTaskWorkflowStatus[] = [
  "DRAFT",
  "READY",
  "NEEDS_REVIEW",
  "IN_PROGRESS",
  "PUBLISHED",
  "RETEST_PENDING",
  "IMPROVED",
  "NO_CHANGE",
  "BLOCKED",
  "REJECTED",
]

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

function normalizeRiskLevel(value: unknown): RepairTaskRiskLevel {
  return RISK_LEVELS.includes(value as RepairTaskRiskLevel)
    ? (value as RepairTaskRiskLevel)
    : "YELLOW"
}

function normalizeWorkflowStatusValue(value: unknown): RepairTaskWorkflowStatus | null {
  const text = asString(value).toUpperCase()
  return WORKFLOW_STATUSES.includes(text as RepairTaskWorkflowStatus)
    ? (text as RepairTaskWorkflowStatus)
    : null
}

function normalizeWorkbenchType(value: unknown): RepairTaskWorkbenchType {
  const text = asString(value)
  return Object.prototype.hasOwnProperty.call(REPAIR_TASK_TYPE_LABELS, text)
    ? (text as RepairTaskWorkbenchType)
    : "CONTENT_UPDATE"
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
  queryRun,
  analysis,
}: {
  task: RepairTaskWorkbenchInput
  queryRun?: RepairTaskQueryRunInput | null
  analysis?: RepairTaskAnalysisInput | null
}) {
  return buildRepairTaskRetestPlan(task, queryRun, analysis)
}

export function getRetestGoalByTaskType(taskType: RepairTaskWorkbenchType | string | null | undefined) {
  const type = normalizeWorkbenchType(taskType)

  const goals: Record<RepairTaskWorkbenchType, string[]> = {
    FAQ: [
      "AI 能否更准确理解服务范围和常见问题。",
      "品牌是否更容易在相关问答中被提及。",
    ],
    CASE_STUDY: [
      "AI 是否能引用真实案例作为推荐依据。",
      "品牌是否在本地 / 行业问题中更具可信度。",
    ],
    QUALIFICATION: [
      "AI 是否能识别资质、认证和背书。",
      "品牌可信度是否改善。",
    ],
    SERVICE_PAGE: [
      "AI 是否能理解服务范围、服务区域和服务对象。",
      "推荐语是否更准确。",
    ],
    SCHEMA: [
      "页面结构化信息是否更容易被机器读取。",
      "FAQ / LocalBusiness / Organization / Article 信息是否更清楚。",
    ],
    COMPARISON: [
      "对比表达是否更事实化、更克制。",
      "是否避免攻击竞品。",
    ],
    SOURCE_BUILDING: [
      "是否新增可公开访问的第三方来源。",
      "AI 是否更容易找到外部证据。",
    ],
    CONTENT_UPDATE: [
      "旧内容是否更准确、更完整。",
      "更新时间和事实依据是否更清楚。",
    ],
  }

  return goals[type]
}

export function getRetestObservationMetrics(
  taskType: RepairTaskWorkbenchType | string | null | undefined,
  riskLevel: RepairTaskRiskLevel | string | null | undefined
) {
  const type = normalizeWorkbenchType(taskType)
  const level = normalizeRiskLevel(riskLevel)
  const metrics = [
    "AI 是否提及品牌",
    "AI 是否推荐品牌",
    "推荐语是否更准确",
    "是否出现新的引用来源",
    "是否仍被竞品压制",
    "情感倾向是否改善",
    "是否出现事实错误",
    "风险等级是否下降",
  ]

  if (type === "SCHEMA") {
    metrics.push("结构化字段是否更容易被识别")
  }

  if (type === "COMPARISON" || level !== "GREEN") {
    metrics.push("对比和承诺措辞是否保持克制")
  }

  return Array.from(new Set(metrics))
}

export function getRetestImprovementCriteria(taskType: RepairTaskWorkbenchType | string | null | undefined) {
  const type = normalizeWorkbenchType(taskType)
  const criteria = [
    "品牌从未提及变为被提及。",
    "品牌从未推荐变为被推荐。",
    "AI 回答开始引用新补充的案例 / FAQ / 资质 / 服务页。",
    "推荐语更准确。",
    "竞品压制减弱。",
    "情感从中性 / 负向变为中性偏正向。",
  ]

  if (type === "SCHEMA") {
    criteria.push("AI 回答更稳定地理解页面结构和 FAQ / LocalBusiness / Organization / Article 信息。")
  }

  if (type === "SOURCE_BUILDING") {
    criteria.push("AI 回答开始出现可公开访问的第三方来源。")
  }

  return criteria
}

export function getRetestNoChangeCriteria(taskType: RepairTaskWorkbenchType | string | null | undefined) {
  const type = normalizeWorkbenchType(taskType)
  const criteria = [
    "AI 仍未提及品牌。",
    "AI 仍只推荐竞品。",
    "未引用新增内容。",
    "回答内容无明显变化。",
  ]

  if (type === "CONTENT_UPDATE") {
    criteria.push("旧内容更新后，AI 回答仍没有体现新的更新时间、范围或事实依据。")
  }

  return criteria
}

export function getRetestRiskCriteria(riskLevel: RepairTaskRiskLevel | string | null | undefined) {
  const level = normalizeRiskLevel(riskLevel)
  const criteria = [
    "AI 出现错误引用。",
    "夸大表达被模型采纳。",
    "出现虚假或无法证明的表述。",
  ]

  if (level === "RED") {
    return [
      ...criteria,
      "触发红色风险，禁止把结果包装成改善。",
      "红色风险任务只能记录风险或改写方向，不能直接执行。",
    ]
  }

  if (level === "YELLOW") {
    return [
      ...criteria,
      "补证据不足，黄色风险仍未通过人工确认。",
    ]
  }

  return [
    ...criteria,
    "原本低风险任务出现新的黄色或红色风险。",
  ]
}

export function getBossReportPlaceholder(
  taskType: RepairTaskWorkbenchType | string | null | undefined,
  riskLevel: RepairTaskRiskLevel | string | null | undefined
) {
  const type = normalizeWorkbenchType(taskType)
  const level = normalizeRiskLevel(riskLevel)
  const typeLabel = REPAIR_TASK_TYPE_LABELS[type]
  const riskLabel = REPAIR_TASK_RISK_LABELS[level]

  return `修复完成后，系统将对同一 query 进行复测，并对比修复前后的品牌提及、推荐语、引用源和风险变化。当前页面只展示 ${typeLabel} / ${riskLabel} 风险任务的验收计划，不生成正式报告，不承诺排名、推荐或流量提升。`
}

export function getRetestStatusLabel({
  mentionStatus,
  rankType,
}: {
  mentionStatus?: string | null
  rankType?: string | null
} = {}) {
  if (mentionStatus === "RECOMMENDED") return "当前已被推荐，复测重点是推荐语是否更准确、证据是否更充分。"
  if (mentionStatus === "MENTIONED") return "当前已被提及但未明确推荐，复测重点是能否进入推荐语境。"
  if (rankType === "EXPLICIT" || rankType === "IMPLIED") return "当前存在推荐语境，复测重点是品牌是否获得更清晰的位置。"
  return "当前未形成稳定提及或推荐，复测重点是品牌是否被自然带入回答。"
}

export function buildRepairTaskRetestPlan(
  task: RepairTaskWorkbenchInput,
  queryRun?: RepairTaskQueryRunInput | null,
  analysis?: RepairTaskAnalysisInput | null
) {
  const taskType = deriveRepairTaskType(task)
  const riskLevel = deriveRepairTaskRiskLevel(task)
  const evidenceSummary = getRepairTaskEvidenceSummary(task)
  const queryText = asString(queryRun?.query?.text) || evidenceSummary.relatedQuery
  const visibility = typeof analysis?.visibilityScore === "number"
    ? `${Math.round(analysis.visibilityScore)} 分`
    : "暂未识别"
  const mention = analysis?.mentionStatus === "RECOMMENDED"
    ? "已推荐"
    : analysis?.mentionStatus === "MENTIONED"
      ? "已提及但未明确推荐"
      : "未形成稳定推荐"
  const statusLabel = getRetestStatusLabel({
    mentionStatus: analysis?.mentionStatus,
    rankType: analysis?.rankType,
  })

  return {
    beforeState: `这条任务来自“${queryText}”的 AI 监测。修复前状态：${mention}，可见度 ${visibility}；证据缺口为“${evidenceSummary.evidenceGap}”，任务类型为 ${REPAIR_TASK_TYPE_LABELS[taskType]}，风险等级为 ${REPAIR_TASK_RISK_LABELS[riskLevel]}。`,
    pendingState: "当前只是复测计划，不代表已经完成复测。修复后应使用同一 query 对比下一轮 AI 回答。",
    metrics: getRetestObservationMetrics(taskType, riskLevel),
    retestGoals: getRetestGoalByTaskType(taskType),
    observationMetrics: getRetestObservationMetrics(taskType, riskLevel),
    improvementCriteria: getRetestImprovementCriteria(taskType),
    noChangeCriteria: getRetestNoChangeCriteria(taskType),
    riskCriteria: getRetestRiskCriteria(riskLevel),
    statusLabel,
    reportSummary: getBossReportPlaceholder(taskType, riskLevel),
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

  return getRiskExecutionDecision(riskLevel)
}

export function getRiskExecutionDecision(riskLevel: RepairTaskRiskLevel | string | null | undefined) {
  const level = normalizeRiskLevel(riskLevel)

  if (level === "RED") {
    return "禁止直接执行。只能记录风险或改写方向，不得自动发布或包装成事实。"
  }

  if (level === "YELLOW") {
    return "暂不建议直接执行。需要补证据或人工确认后，再进入内容制作。"
  }

  return "可进入内容制作，但仍需基于真实资料；这不代表自动发布，也不代表系统已经完成审核。"
}

export function getRequiredEvidenceByTaskType(
  taskType: RepairTaskWorkbenchType | string | null | undefined,
  riskLevel?: RepairTaskRiskLevel | string | null
) {
  const type = normalizeWorkbenchType(taskType)
  const level = normalizeRiskLevel(riskLevel ?? "GREEN")

  const baseByType: Record<RepairTaskWorkbenchType, string[]> = {
    FAQ: ["服务范围", "真实流程", "常见问题答案", "更新时间"],
    CASE_STUDY: ["真实项目名称或脱敏项目", "施工 / 服务过程", "结果说明", "可核验图片或记录"],
    QUALIFICATION: ["营业执照", "资质证书", "行业背书", "授权证明"],
    SERVICE_PAGE: ["服务范围", "服务流程", "适用场景", "案例或资质依据"],
    SCHEMA: ["页面真实内容", "Organization / LocalBusiness / FAQ / Article 等结构化字段", "与页面正文一致"],
    COMPARISON: ["对比维度", "事实来源", "不攻击竞品", "不使用“碾压”“吊打”等表达"],
    SOURCE_BUILDING: ["第三方页面", "媒体来源", "平台资料", "可公开访问的证明来源"],
    CONTENT_UPDATE: ["关联 query", "页面现有内容", "需要补充的事实依据", "更新时间"],
  }

  const riskEvidence = level === "YELLOW"
    ? ["补充人工可核验来源", "确认措辞不夸大"]
    : level === "RED"
      ? ["记录风险来源", "准备改写后的安全方向"]
      : []

  return Array.from(new Set([...baseByType[type], ...riskEvidence]))
}

export function getRiskProhibitedActions(riskLevel: RepairTaskRiskLevel | string | null | undefined) {
  const level = normalizeRiskLevel(riskLevel)

  if (level === "RED") {
    return [
      "攻击竞品",
      "伪造客户评价",
      "虚构案例",
      "伪造榜单",
      "批量灌水",
      "隐藏文本",
      "提示词注入",
      "RAG 投毒",
      "夸大或无法证明的承诺",
    ]
  }

  if (level === "YELLOW") {
    return [
      "未补证据就直接执行",
      "把排名 / 最好 / 推荐写成确定事实",
      "使用无法核验的客户评价",
      "承诺价格、效果或转化结果",
      "把第三方数据当成已确认结论",
    ]
  }

  return [
    "跳过事实来源确认",
    "自动发布线上内容",
    "把系统建议包装成已审核结论",
  ]
}

export function getHumanGateNotice(riskLevel: RepairTaskRiskLevel | string | null | undefined) {
  const level = normalizeRiskLevel(riskLevel)

  if (level === "RED") {
    return "这不是自动修复结论。红色任务必须先由负责人改写方向或记录风险，系统不会自动发布、不会自动修改线上内容。"
  }

  if (level === "YELLOW") {
    return "这不是自动修复结论，而是执行前的风险提示。黄色任务必须由人工补证据并确认措辞后再处理。"
  }

  return "当前阶段仅提供审核建议。最终执行仍需人工确认事实来源，系统不会自动发布、不会自动修改线上内容、不会绕过负责人审核。"
}

export function normalizeRepairTaskStatus(task: RepairTaskWorkbenchInput): RepairTaskWorkflowStatus {
  const directStatus = normalizeWorkflowStatusValue(task.status)
  if (directStatus) return directStatus

  const riskLevel = deriveRepairTaskRiskLevel(task)

  if (task.status === "TODO") return riskLevel === "RED" ? "NEEDS_REVIEW" : "READY"
  if (task.status === "BRIEF_READY") return "IN_PROGRESS"
  if (task.status === "DRAFT_READY") return "NEEDS_REVIEW"
  if (task.status === "REVIEW_NEEDED") return "NEEDS_REVIEW"
  if (task.status === "APPROVED") return "RETEST_PENDING"
  if (task.status === "EXPORTED") return "PUBLISHED"
  if (task.status === "SKIPPED") return "REJECTED"

  return "BLOCKED"
}

export function getRepairTaskStatusLabel(status: RepairTaskWorkflowStatus | string | null | undefined) {
  const normalized = normalizeWorkflowStatusValue(status) ?? "BLOCKED"
  return REPAIR_TASK_STATUS_LABELS[normalized]
}

export function getRepairTaskStatusDescription(status: RepairTaskWorkflowStatus | string | null | undefined) {
  const normalized = normalizeWorkflowStatusValue(status) ?? "BLOCKED"
  return REPAIR_TASK_STATUS_DESCRIPTIONS[normalized]
}

export function getRepairTaskNextAction(task: RepairTaskWorkbenchInput) {
  const status = normalizeRepairTaskStatus(task)
  const riskLevel = deriveRepairTaskRiskLevel(task)

  if (riskLevel === "RED") {
    return "先记录风险或改写修复方向，不要直接进入内容制作。"
  }

  const actions: Record<RepairTaskWorkflowStatus, string> = {
    DRAFT: "先补齐证据依据、建议产出物和风险说明。",
    READY: "由人工确认事实来源后，进入内容制作。",
    NEEDS_REVIEW: "补充证据并由负责人确认措辞和执行边界。",
    IN_PROGRESS: "完成内容制作后，检查是否满足验收标准。",
    PUBLISHED: "准备使用同一 query 做人工复测。",
    RETEST_PENDING: "执行人工复测，并记录是否改善、暂无变化或风险未通过。",
    IMPROVED: "整理老板可读的修复摘要和复测依据。",
    NO_CHANGE: "复盘证据缺口，决定补证据、改页面或继续观察。",
    BLOCKED: "先确认任务状态和证据来源，不能直接推进。",
    REJECTED: "停止执行；如仍有价值，重新创建更安全的任务。",
  }

  return actions[status]
}

export function getRepairTaskHumanGate(task: RepairTaskWorkbenchInput) {
  const status = normalizeRepairTaskStatus(task)
  const riskLevel = deriveRepairTaskRiskLevel(task)

  return (
    riskLevel !== "GREEN" ||
    status === "NEEDS_REVIEW" ||
    status === "BLOCKED" ||
    status === "REJECTED" ||
    status === "DRAFT"
  )
}

export function getRepairTaskLifecycleSteps(task: RepairTaskWorkbenchInput): RepairTaskLifecycleStep[] {
  const currentStatus = normalizeRepairTaskStatus(task)
  const currentIndex = WORKFLOW_STATUS_ORDER.indexOf(currentStatus)

  return WORKFLOW_STATUS_ORDER.map((status, index) => ({
    status,
    label: getRepairTaskStatusLabel(status),
    description: getRepairTaskStatusDescription(status),
    state: status === "BLOCKED" || status === "REJECTED"
      ? status === currentStatus ? "blocked" : "pending"
      : index < currentIndex
        ? "completed"
        : status === currentStatus
          ? "current"
          : "pending",
  }))
}

export function getRepairTaskWorkflowViewModel(task: RepairTaskWorkbenchInput) {
  const status = normalizeRepairTaskStatus(task)
  const riskLevel = deriveRepairTaskRiskLevel(task)
  const humanGateRequired = getRepairTaskHumanGate(task)
  const canRetest = status === "PUBLISHED" || status === "RETEST_PENDING"
  const canReport = status === "IMPROVED" || status === "NO_CHANGE"
  const warning = riskLevel === "RED"
    ? "红色风险不能直接执行，必须人工改写方向或记录风险。"
    : status === "BLOCKED"
      ? "当前状态无法安全识别，不能当作可执行任务。"
      : "本页只展示下一步建议，不会自动更新状态、触发复测或生成报告。"

  return {
    status,
    label: getRepairTaskStatusLabel(status),
    description: getRepairTaskStatusDescription(status),
    nextAction: getRepairTaskNextAction(task),
    humanGateRequired,
    canRetest,
    canReport,
    warning,
    steps: getRepairTaskLifecycleSteps(task),
    safetyNotice: "本页仅展示人工推进建议，不会自动执行、不生成报告、不触发复测，也不会修改线上内容。",
  }
}

export function getRiskReviewSummary(
  taskType: RepairTaskWorkbenchType | string | null | undefined,
  riskLevel: RepairTaskRiskLevel | string | null | undefined
) {
  const type = normalizeWorkbenchType(taskType)
  const level = normalizeRiskLevel(riskLevel)
  const typeLabel = REPAIR_TASK_TYPE_LABELS[type]

  if (level === "RED") {
    return `${typeLabel} 当前为红色风险：禁止直接执行，只能记录风险或改写方向。`
  }

  if (level === "YELLOW") {
    return `${typeLabel} 当前为黄色风险：需要补证据或人工审核后再执行。`
  }

  return `${typeLabel} 当前为绿色风险：可进入内容制作，但仍需人工确认事实来源。`
}

export function buildRepairTaskRiskReview(task: RepairTaskWorkbenchInput) {
  const taskType = deriveRepairTaskType(task)
  const riskLevel = deriveRepairTaskRiskLevel(task)

  return {
    level: riskLevel,
    reason: getRepairTaskRiskReason(task),
    handling: getRiskExecutionDecision(riskLevel),
    summary: getRiskReviewSummary(taskType, riskLevel),
    executionDecision: getRiskExecutionDecision(riskLevel),
    requiredEvidence: getRequiredEvidenceByTaskType(taskType, riskLevel),
    prohibitedActions: getRiskProhibitedActions(riskLevel),
    humanGateNotice: getHumanGateNotice(riskLevel),
  }
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
  const riskReview = buildRepairTaskRiskReview(task)
  const workflow = getRepairTaskWorkflowViewModel(task)
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
    riskReview,
    workflow,
    retestPlan: formatRepairTaskRetestPlaceholder({ task, queryRun, analysis }),
  }
}
