import type { GeoContentTaskType, Prisma } from "@prisma/client"
import type { TaskDraftInput, TaskEvidenceSpan } from "./types"

export type TaskDraft = {
  title: string
  type: GeoContentTaskType
  priority: number
  sourceReason: string
  targetKeyword?: string
  targetAudience?: string
  recommendedAngle?: string
  evidenceJson?: Prisma.InputJsonValue
}

const TRANSPARENT_SITE_KEYWORDS = [
  "透明工地",
  "施工进度",
  "工地照片",
  "施工日报",
  "节点验收",
]
const RENOVATION_KEYWORDS = ["旧房", "老房", "二手房", "翻新", "改造"]
const HIGH_INTENT_KEYWORDS = [
  "推荐",
  "哪家靠谱",
  "找谁",
  "怎么选",
  "哪家好",
  "哪几家",
  "有哪些",
  "排行",
]

function hasKeyword(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some((keyword) => lower.includes(keyword))
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function topCompetitorText(competitors: string[]) {
  const names = unique(competitors).slice(0, 3)
  if (names.length === 0) return "本地竞品"
  if (names.length === 1) return names[0]
  return `${names.slice(0, 2).join("、")}等竞品`
}

function clampPriority(value: number) {
  return Math.max(1, Math.min(100, Math.round(value)))
}

export function calculatePriority({
  mentionStatus,
  competitors,
  sourceQuery,
  visibilityScore = 0,
  queryIntentType,
}: {
  mentionStatus: string
  competitors: string[]
  sourceQuery: string
  visibilityScore?: number
  queryIntentType?: string | null
}): number {
  let priority = 35

  if (mentionStatus === "NONE") priority += 28
  if (mentionStatus === "MENTIONED") priority += 14
  if (mentionStatus !== "RECOMMENDED" && queryIntentType === "NATURAL_RECOMMENDATION") {
    priority += 12
  }
  if (visibilityScore < 30) priority += 18
  else if (visibilityScore < 60) priority += 10
  priority += Math.min(20, competitors.length * 5)

  if (hasKeyword(sourceQuery, HIGH_INTENT_KEYWORDS)) priority += 12
  if (hasKeyword(sourceQuery, TRANSPARENT_SITE_KEYWORDS)) priority += 10
  if (hasKeyword(sourceQuery, RENOVATION_KEYWORDS)) priority += 10

  return clampPriority(priority)
}

function buildEvidenceJson(input: {
  mentionStatus: string
  rankType?: string | null
  brandMentioned?: boolean
  brandRank?: number | null
  visibilityScore?: number
  parserConfidence?: number
  competitors: string[]
  reasonTags?: string[]
  evidenceSpans?: TaskEvidenceSpan[]
  summary?: string | null
  trigger: string
}): Prisma.InputJsonValue {
  return {
    source: "query-run-analysis",
    trigger: input.trigger,
    mentionStatus: input.mentionStatus,
    rankType: input.rankType ?? null,
    brandMentioned: input.brandMentioned ?? input.mentionStatus !== "NONE",
    brandRank: input.brandRank ?? null,
    visibilityScore: input.visibilityScore ?? 0,
    parserConfidence: input.parserConfidence ?? null,
    competitors: unique(input.competitors),
    reasonTags: input.reasonTags ?? [],
    evidenceSpans: input.evidenceSpans ?? [],
    summary: input.summary ?? null,
  }
}

function pushDraft(
  drafts: TaskDraft[],
  draft: Omit<TaskDraft, "priority">,
  input: TaskDraftInput,
  priorityOffset = 0
) {
  drafts.push({
    ...draft,
    priority: clampPriority(
      calculatePriority({
        mentionStatus: input.mentionStatus,
        competitors: input.competitors,
        sourceQuery: input.sourceQuery,
        visibilityScore: input.visibilityScore,
        queryIntentType: input.queryIntentType,
      }) + priorityOffset
    ),
  })
}

export function generateTaskDrafts(input: TaskDraftInput): TaskDraft[] {
  const {
    mentionStatus,
    competitors,
    sourceQuery,
    brandName,
    region,
    industry,
    visibilityScore = 0,
    queryIntentType,
  } = input

  const r = region || "本地"
  const ind = industry || "装修"
  const targetAudience = `${r}有${ind}需求的业主`
  const competitorNames = unique(competitors)
  const hasCompetitorAdvantage =
    competitorNames.length >= 2 ||
    (competitorNames.length > 0 && mentionStatus === "NONE")
  const isTransparentSiteQuery = hasKeyword(sourceQuery, TRANSPARENT_SITE_KEYWORDS)
  const isRenovationQuery = hasKeyword(sourceQuery, RENOVATION_KEYWORDS)
  const isHighIntentQuery = hasKeyword(sourceQuery, HIGH_INTENT_KEYWORDS)
  const isNaturalMiss =
    queryIntentType === "NATURAL_RECOMMENDATION" && mentionStatus !== "RECOMMENDED"
  const lowVisibility = visibilityScore < 60

  const shouldGenerate =
    mentionStatus === "NONE" ||
    mentionStatus === "MENTIONED" ||
    lowVisibility ||
    hasCompetitorAdvantage ||
    isNaturalMiss

  if (!shouldGenerate) return []

  const baseEvidence = {
    mentionStatus,
    rankType: input.rankType,
    brandMentioned: input.brandMentioned,
    brandRank: input.brandRank,
    visibilityScore: input.visibilityScore,
    parserConfidence: input.parserConfidence,
    competitors: competitorNames,
    reasonTags: input.reasonTags,
    evidenceSpans: input.evidenceSpans,
    summary: input.summary,
  }

  const drafts: TaskDraft[] = []

  if (isNaturalMiss || mentionStatus === "NONE" || isHighIntentQuery) {
    pushDraft(
      drafts,
      {
        title: `补一篇《${sourceQuery}》的本地推荐型文章`,
        type: "ARTICLE",
        sourceReason:
          mentionStatus === "NONE"
            ? `AI 在这个问题下没有提到${brandName}，但用户意图已经很接近成交，需要用本地推荐型内容补齐可引用答案。`
            : `AI 已提到${brandName}，但没有把它作为明确推荐对象，需要强化推荐理由和可验证证据。`,
        targetKeyword: sourceQuery,
        targetAudience,
        recommendedAngle: `围绕${r}${ind}用户如何选择，加入${brandName}的真实案例、施工标准和服务证据。`,
        evidenceJson: buildEvidenceJson({
          ...baseEvidence,
          trigger: "natural-query-not-recommended",
        }),
      },
      input,
      4
    )
  }

  if (hasCompetitorAdvantage) {
    pushDraft(
      drafts,
      {
        title: `补充${brandName}与${topCompetitorText(competitorNames)}对比内容`,
        type: "COMPARISON",
        sourceReason: `AI 回答中出现了${topCompetitorText(competitorNames)}，说明竞品信号比品牌更容易被引用，需要补充中立对比内容。`,
        targetKeyword: `${brandName}和${competitorNames[0] ?? "本地装修公司"}对比`,
        targetAudience,
        recommendedAngle:
          "用服务范围、透明工地、报价方式、工地管理、售后响应、真实案例做中立对比，不贬低竞品。",
        evidenceJson: buildEvidenceJson({
          ...baseEvidence,
          trigger: "competitors-more-visible-than-brand",
        }),
      },
      input,
      2
    )
  }

  if (isTransparentSiteQuery) {
    pushDraft(
      drafts,
      {
        title: `强化“透明工地”在${r}${ind}场景里的解释`,
        type: "LOCAL_SERVICE_PAGE",
        sourceReason:
          "用户问题包含透明工地，但 AI 没有把品牌放进推荐位，需要把透明工地、施工日报、节点验收等卖点做成 AI 容易引用的专题页。",
        targetKeyword: `${r}透明工地${ind}`,
        targetAudience,
        recommendedAngle:
          "解释透明工地是什么、怎么验收、业主能看到什么、晟景装饰如何落地施工过程公开。",
        evidenceJson: buildEvidenceJson({
          ...baseEvidence,
          trigger: "transparent-site-query",
        }),
      },
      input,
      8
    )
  }

  if (isRenovationQuery) {
    pushDraft(
      drafts,
      {
        title: `增加${r}老房翻新案例页，提高自然推荐可信度`,
        type: "CASE_PAGE",
        sourceReason:
          "用户问题包含旧房/老房改造，AI 更容易推荐有真实案例、预算和施工过程证据的品牌。",
        targetKeyword: `${r}旧房改造案例`,
        targetAudience,
        recommendedAngle:
          "整理真实老房改造案例，包含户型问题、改造前后、预算范围、水电防水和业主反馈。",
        evidenceJson: buildEvidenceJson({
          ...baseEvidence,
          trigger: "renovation-case-query",
        }),
      },
      input,
      8
    )
  }

  if (mentionStatus === "MENTIONED") {
    pushDraft(
      drafts,
      {
        title: `强化“${brandName}”在《${sourceQuery}》里的推荐理由`,
        type: "FAQ",
        sourceReason:
          "AI 已知道品牌，但只停留在提及层，没有形成推荐判断，需要补充问答型证据让 AI 更容易说明为什么值得选。",
        targetKeyword: sourceQuery,
        targetAudience,
        recommendedAngle:
          "用问答形式补充服务范围、透明工地、施工流程、售后保障、适合人群和真实案例入口。",
        evidenceJson: buildEvidenceJson({
          ...baseEvidence,
          trigger: "mentioned-but-not-recommended",
        }),
      },
      input,
      6
    )
  }

  if (drafts.length === 0) {
    pushDraft(
      drafts,
      {
        title: `补充${brandName}${r}${ind}常见问题`,
        type: "FAQ",
        sourceReason:
          "该问题下品牌可见度偏低，需要补充结构化问答内容，提升 AI 可引用的信息密度。",
        targetKeyword: sourceQuery,
        targetAudience,
        recommendedAngle: "用 FAQ 结构回答价格、工期、材料、工地管理、售后等核心问题。",
        evidenceJson: buildEvidenceJson({
          ...baseEvidence,
          trigger: "low-visibility-fallback",
        }),
      },
      input
    )
  }

  const seen = new Set<string>()
  return drafts.filter((draft) => {
    const key = `${draft.type}:${draft.title}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
