type AnalysisLike = {
  mentionStatus?: string | null
  brandMentioned?: boolean | null
  brandRank?: number | null
  visibilityScore?: number | null
  competitorsJson?: unknown
  summary?: string | null
}

type QueryRunLike = {
  id: string
  status: string
  provider: string
  model: string
  mentioned: boolean
  rank: number | null
  competitors: string[]
  rawOutput?: string | null
  createdAt?: Date | string
  finishedAt?: Date | string | null
  query?: { text: string }
  analysis?: AnalysisLike | null
}

export type CompetitorView = {
  name: string
  rank: number | null
  recommended: boolean
  evidence: string
  reasonTags: string[]
}

export type CompetitorSummary = {
  name: string
  count: number
  bestRank: number | null
  questions: Array<{ id: string; text: string }>
  runIds: string[]
}

const COMPETITOR_BLACKLIST = new Set([
  "整体装修",
  "本地装修",
  "装修公司",
  "免费设计",
  "施工队",
  "设计师",
])

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function providerDisplayName(provider: string) {
  if (provider === "ark") return "豆包 Ark"
  if (provider === "deepseek") return "DeepSeek"
  if (provider === "openai") return "OpenAI"
  return provider || "-"
}

export function formatRunStatus(status: string) {
  if (status === "SUCCESS") return "监测成功"
  if (status === "FAILED") return "监测失败"
  if (status === "RUNNING") return "监测中"
  if (status === "PENDING") return "等待监测"
  return "尚未监测"
}

export function formatBatchStatus(status: string) {
  if (status === "SUCCESS") return "监测成功"
  if (status === "PARTIAL_FAILURE") return "部分成功"
  if (status === "FAILED") return "监测失败"
  if (status === "RUNNING") return "监测中"
  if (status === "PENDING") return "等待监测"
  return status || "-"
}

export function formatRank(rank: number | null | undefined) {
  return rank ? `Rank #${rank}` : "暂无排名"
}

export function getMentionStatus(run: {
  mentioned?: boolean
  rank?: number | null
  analysis?: AnalysisLike | null
}) {
  return run.analysis?.mentionStatus ?? (run.mentioned ? "MENTIONED" : "NONE")
}

export function getBrandRank(run: {
  rank?: number | null
  analysis?: AnalysisLike | null
}) {
  return run.analysis?.brandRank ?? run.rank ?? null
}

export function getVisibilityScore(run: { analysis?: AnalysisLike | null }) {
  return run.analysis?.visibilityScore ?? null
}

export function isBrandRecommended(run: {
  mentioned?: boolean
  rank?: number | null
  analysis?: AnalysisLike | null
}) {
  return getMentionStatus(run) === "RECOMMENDED"
}

export function mentionStatusLabel(run: {
  mentioned?: boolean
  rank?: number | null
  analysis?: AnalysisLike | null
}) {
  const status = getMentionStatus(run)
  const rank = getBrandRank(run)

  if (status === "RECOMMENDED") {
    return rank ? `已推荐 ${formatRank(rank)}` : "已推荐"
  }
  if (status === "MENTIONED") return "已提及，未明确推荐"
  return "未自然提及"
}

export function normalizeCompetitorName(name: string) {
  return name.trim().replace(/[，,。.；;：:）)】\]"“”']+$/, "")
}

export function isDisplayCompetitor(name: string) {
  const normalized = normalizeCompetitorName(name)
  if (!normalized) return false
  if (COMPETITOR_BLACKLIST.has(normalized)) return false
  return !Array.from(COMPETITOR_BLACKLIST).some((blocked) => normalized === blocked)
}

export function toCompetitorViews({
  competitorsJson,
  fallbackCompetitors = [],
}: {
  competitorsJson?: unknown
  fallbackCompetitors?: string[]
}): CompetitorView[] {
  if (Array.isArray(competitorsJson)) {
    return competitorsJson
      .filter(isPlainObject)
      .map((item) => ({
        name: normalizeCompetitorName(String(item.name ?? "")),
        rank: typeof item.rank === "number" ? item.rank : null,
        recommended: Boolean(item.recommended),
        evidence: typeof item.evidence === "string" ? item.evidence : "",
        reasonTags: Array.isArray(item.reasonTags)
          ? item.reasonTags.map(String)
          : [],
      }))
      .filter((item) => isDisplayCompetitor(item.name))
  }

  return fallbackCompetitors
    .map((name) => ({
      name: normalizeCompetitorName(name),
      rank: null,
      recommended: false,
      evidence: "",
      reasonTags: [],
    }))
    .filter((item) => isDisplayCompetitor(item.name))
}

export function aggregateCompetitors(runs: QueryRunLike[]): CompetitorSummary[] {
  const byName = new Map<string, CompetitorSummary>()

  for (const run of runs) {
    const competitors = toCompetitorViews({
      competitorsJson: run.analysis?.competitorsJson,
      fallbackCompetitors: run.competitors,
    })

    for (const competitor of competitors) {
      const existing =
        byName.get(competitor.name) ??
        ({
          name: competitor.name,
          count: 0,
          bestRank: null,
          questions: [],
          runIds: [],
        } satisfies CompetitorSummary)

      existing.count += 1
      existing.runIds.push(run.id)
      if (run.query?.text) {
        existing.questions.push({ id: run.id, text: run.query.text })
      }
      if (
        competitor.rank &&
        (existing.bestRank === null || competitor.rank < existing.bestRank)
      ) {
        existing.bestRank = competitor.rank
      }

      byName.set(competitor.name, existing)
    }
  }

  return Array.from(byName.values()).sort((a, b) => b.count - a.count)
}

export function summarizeRuns({
  runs,
  brandName,
}: {
  runs: QueryRunLike[]
  brandName: string | null
}) {
  const successfulRuns = runs.filter((run) => run.status === "SUCCESS")
  const mentionedRuns = successfulRuns.filter(
    (run) => getMentionStatus(run) !== "NONE"
  )
  const recommendedRuns = successfulRuns.filter(isBrandRecommended)
  const rankedRuns = recommendedRuns
    .map(getBrandRank)
    .filter((rank): rank is number => typeof rank === "number")
  const visibilityScores = successfulRuns
    .map(getVisibilityScore)
    .filter((score): score is number => typeof score === "number")
  const competitors = aggregateCompetitors(successfulRuns)
  const displayBrandName = brandName?.trim() || "当前品牌"
  const mentionRate = successfulRuns.length
    ? Math.round((mentionedRuns.length / successfulRuns.length) * 100)
    : 0
  const recommendationRate = successfulRuns.length
    ? Math.round((recommendedRuns.length / successfulRuns.length) * 100)
    : 0
  const averageRank = rankedRuns.length
    ? Math.round((rankedRuns.reduce((sum, rank) => sum + rank, 0) / rankedRuns.length) * 10) / 10
    : null
  const averageVisibilityScore = visibilityScores.length
    ? Math.round(
        (visibilityScores.reduce((sum, score) => sum + score, 0) /
          visibilityScores.length) *
          10
      ) / 10
    : 0

  const conclusion =
    mentionedRuns.length === 0
      ? `本轮监测中，AI 没有自然提及 ${displayBrandName}。这说明当前品牌在这些问题下的 AI 可见度不足。`
      : recommendedRuns.length === 0
        ? `本轮 AI 曾提及 ${displayBrandName}，但没有将其作为明确推荐对象。`
        : `本轮 AI 已经在部分问题中推荐 ${displayBrandName}。`

  const findings = [
    mentionedRuns.length === 0
      ? `本轮 ${successfulRuns.length} 个成功问题中，AI 没有自然提及 ${displayBrandName}。`
      : `本轮 ${successfulRuns.length} 个成功问题中，AI 提及 ${displayBrandName} ${mentionedRuns.length} 次。`,
    competitors.length
      ? `AI 更常提到 ${competitors.slice(0, 3).map((item) => item.name).join("、")} 等竞品或候选。`
      : "AI 主要给出了通用选择建议，未形成稳定竞品名单。",
    "当前需要补充本地案例、服务说明、业主评价和第三方口碑信号。",
  ]

  return {
    successfulRuns,
    mentionedRuns,
    recommendedRuns,
    unmentionedRuns: successfulRuns.filter((run) => getMentionStatus(run) === "NONE"),
    mentionRate,
    recommendationRate,
    averageRank,
    averageVisibilityScore,
    competitors,
    conclusion,
    findings,
  }
}

export function generateBatchSuggestions({
  runs,
  brandName,
}: {
  runs: QueryRunLike[]
  brandName: string | null
}) {
  const summary = summarizeRuns({ runs, brandName })
  const suggestions = new Map<string, { title: string; reason: string; action: string }>()

  if (summary.mentionedRuns.length === 0) {
    suggestions.set("brand-intro", {
      title: "补品牌基础介绍页",
      reason: "本轮没有自然提及品牌，说明 AI 缺少稳定实体识别信号。",
      action: "补充品牌服务介绍、服务范围、联系方式、真实案例和常见问题。",
    })
    suggestions.set("local-service", {
      title: "补本地服务页",
      reason: "自然推荐问题集中在本地装修场景。",
      action: "建设围绕地区和服务类型的页面，讲清本地施工、售后和案例。",
    })
    suggestions.set("faq", {
      title: "补 FAQ 问答内容",
      reason: "AI 更容易理解结构化问答内容。",
      action: "围绕预算、工期、材料、售后、避坑问题建立问答。",
    })
  }

  if (summary.competitors.length > 0) {
    suggestions.set("comparison-guide", {
      title: "做本地装修公司选择指南",
      reason: "AI 已经在回答中给出其他候选，说明比较语境已经存在。",
      action: "用选择标准、案例证据和服务流程做客观对比，不贬低竞品。",
    })
  }

  if (runs.some((run) => run.query?.text.includes("透明工地"))) {
    suggestions.set("site-transparency", {
      title: "强化透明工地专题页",
      reason: "监测问题包含透明工地，需要让 AI 理解这一特色。",
      action: "补充施工日报、现场照片、节点验收、材料进场和工地直播说明。",
    })
  }

  if (runs.some((run) => run.query?.text.includes("旧房改造"))) {
    suggestions.set("old-house", {
      title: "补旧房改造案例和 FAQ",
      reason: "旧房改造是独立需求场景，需要专项内容支撑。",
      action: "整理拆改、水电、防水、收纳和预算前后对比案例。",
    })
  }

  return Array.from(suggestions.values()).slice(0, 5)
}
