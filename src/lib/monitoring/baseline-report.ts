import type { BrandProfile, QueryIntentType, RunBatch, Tenant } from "@prisma/client"

import { formatQueryIntentType, isNaturalMetricIntentType } from "./geo-intent"

type BaselineRun = {
  id: string
  provider: string
  model: string
  status: string
  prompt: string
  rawOutput: string | null
  mentioned: boolean
  rank: number | null
  competitors: string[]
  notes: string | null
  errorMessage?: string | null
  createdAt?: Date
  query: {
    id: string
    text: string
    intentType: QueryIntentType
  }
}

export function calculateBaselineMetrics(runs: BaselineRun[]) {
  const successfulRuns = runs.filter((run) => run.status === "SUCCESS")
  const naturalRuns = successfulRuns.filter((run) =>
    isNaturalMetricIntentType(run.query.intentType)
  )
  const brandAwarenessRuns = successfulRuns.filter(
    (run) => run.query.intentType === "BRAND_AWARENESS"
  )
  const mentionedNaturalRuns = naturalRuns.filter((run) => run.mentioned)
  const rankedNaturalRuns = mentionedNaturalRuns.filter(
    (run): run is BaselineRun & { rank: number } => run.rank !== null
  )

  const competitorCounts = new Map<string, number>()
  for (const run of successfulRuns) {
    for (const competitor of run.competitors) {
      competitorCounts.set(competitor, (competitorCounts.get(competitor) ?? 0) + 1)
    }
  }

  const competitorList = Array.from(competitorCounts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))
    .map(([name]) => name)

  const naturalMentionRate = naturalRuns.length
    ? Math.round((mentionedNaturalRuns.length / naturalRuns.length) * 100)
    : 0
  const brandAwarenessAccuracy = brandAwarenessRuns.length
    ? Math.round(
        (brandAwarenessRuns.filter((run) => run.mentioned).length /
          brandAwarenessRuns.length) *
          100
      )
    : 0

  return {
    naturalRunCount: naturalRuns.length,
    naturalMentionRate,
    averageRank: rankedNaturalRuns.length
      ? Number(
          (
            rankedNaturalRuns.reduce((sum, run) => sum + run.rank, 0) /
            rankedNaturalRuns.length
          ).toFixed(1)
        )
      : null,
    brandAwarenessRunCount: brandAwarenessRuns.length,
    brandAwarenessAccuracy,
    competitorList,
    successCount: successfulRuns.length,
    failureCount: runs.length - successfulRuns.length,
  }
}

export function buildBaselineAnomalyFlags(runs: BaselineRun[]) {
  const metrics = calculateBaselineMetrics(runs)
  const flags: string[] = []
  const brandAwarenessRuns = runs.filter(
    (run) => run.status === "SUCCESS" && run.query.intentType === "BRAND_AWARENESS"
  )

  if (metrics.naturalRunCount > 0 && metrics.naturalMentionRate === 0) {
    flags.push("BRAND_NOT_NATURALLY_RECOMMENDED")
  }

  if (metrics.competitorList.length > 0 && metrics.naturalMentionRate === 0) {
    flags.push("COMPETITORS_VISIBLE_BRAND_ABSENT")
  }

  if (
    brandAwarenessRuns.length > 0 &&
    brandAwarenessRuns.every((run) => !run.mentioned)
  ) {
    flags.push("LOW_BRAND_AWARENESS")
  }

  return flags
}

export function buildBaselineConclusions(runs: BaselineRun[]) {
  const metrics = calculateBaselineMetrics(runs)
  const conclusions: string[] = []
  const topCompetitors = metrics.competitorList.slice(0, 3)

  if (metrics.naturalRunCount > 0 && metrics.naturalMentionRate === 0) {
    conclusions.push("本轮自然推荐问题中，晟景装饰暂未被 AI 自然推荐。")
  } else if (metrics.naturalRunCount > 0) {
    conclusions.push(
      `本轮自然推荐率为 ${metrics.naturalMentionRate}%，可作为上线前基线。`
    )
  }

  if (topCompetitors.length > 0) {
    conclusions.push(`本轮 AI 回答中出现的主要竞品包括：${topCompetitors.join("、")}。`)
  } else {
    conclusions.push("本轮 AI 回答未抽取到明确竞品名称。")
  }

  if (metrics.brandAwarenessRunCount > 0) {
    conclusions.push(
      `品牌认知类问题准确率为 ${metrics.brandAwarenessAccuracy}%，后续可持续对比。`
    )
  }

  conclusions.push("建议先完成内容中心正式上线、地图信息统一、真实案例公开页和透明工地专题页收录。")

  return conclusions.slice(0, 5)
}

export function buildBaselineMarkdownReport({
  tenant,
  brandProfile,
  batch,
  runs,
  generatedAt,
}: {
  tenant: Tenant
  brandProfile: BrandProfile | null
  batch: RunBatch
  runs: BaselineRun[]
  generatedAt: Date
}) {
  const metrics = calculateBaselineMetrics(runs)
  const conclusions = buildBaselineConclusions(runs)
  const noMentionRuns = runs.filter(
    (run) =>
      run.status === "SUCCESS" &&
      isNaturalMetricIntentType(run.query.intentType) &&
      !run.mentioned
  )

  const genericRuns = runs.filter(
    (run) =>
      run.status === "SUCCESS" &&
      !run.mentioned &&
      run.competitors.length === 0 &&
      (run.rawOutput?.length ?? 0) > 0
  )

  const tableRows = runs.map((run) =>
    [
      run.query.text.replaceAll("|", "\\|"),
      formatQueryIntentType(run.query.intentType),
      run.mentioned ? "是" : "否",
      run.rank ?? "-",
      run.competitors.join("、") || "-",
      (run.notes ?? run.errorMessage ?? "已完成").replaceAll("|", "\\|"),
    ].join(" | ")
  )

  return [
    "# 晟景装饰 GEO 上线前基线监测报告",
    "",
    "## 基本信息",
    `- 品牌：${brandProfile?.brandName ?? tenant.brandName ?? tenant.name}`,
    `- 行业：${brandProfile?.industry ?? tenant.industry ?? "-"}`,
    `- 地区：${brandProfile?.region ?? tenant.region ?? "-"}`,
    `- Provider：${runs[0]?.provider ?? "DeepSeek"}`,
    `- Batch ID：${batch.id}`,
    `- 运行时间：${generatedAt.toISOString()}`,
    "",
    "## 核心结论",
    `- 自然推荐率：${metrics.naturalMentionRate}%`,
    `- 平均排名：${metrics.averageRank ?? "-"}`,
    `- 品牌认知准确率：${metrics.brandAwarenessAccuracy}%`,
    `- 出现竞品：${metrics.competitorList.join("、") || "-"}`,
    "",
    "## 本轮问题明细",
    "问题 | 类型 | 是否提及晟景 | 排名 | 竞品 | 结果摘要",
    "--- | --- | --- | --- | --- | ---",
    ...tableRows,
    "",
    "## 重要发现",
    ...conclusions.map((item) => `- ${item}`),
    ...noMentionRuns
      .slice(0, 5)
      .map((run) => `- 未推荐晟景的问题：${run.query.text}`),
    ...metrics.competitorList.slice(0, 5).map((name) => `- 被推荐或提及的竞品：${name}`),
    ...genericRuns.slice(0, 3).map((run) => `- AI 只给泛建议的问题：${run.query.text}`),
    "",
    "## 下一步建议",
    "- 补内容中心上线与收录",
    "- 补交城本地案例",
    "- 补透明工地专题",
    "- 补旧房改造案例",
    "- 补地图 / 小红书 / 抖音 / 公众号等外部信号",
    "",
    "## 注意",
    "本报告为 API 监测版结果，不等同于所有真实用户终端的展示结果。",
    "不同模型、时间、地域、登录状态、搜索联网能力可能导致回答不同。",
    "",
  ].join("\n")
}
