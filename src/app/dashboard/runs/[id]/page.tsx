import Link from "next/link"
import { notFound } from "next/navigation"

import { AnalyzeRunButton } from "@/components/analyze-run-button"
import { GenerateContentTasksButton } from "@/components/generate-content-tasks-button"
import { QueryRunStatusBadge } from "@/components/query-run-status-badge"
import { RunRawOutputViewer } from "@/components/run-raw-output-viewer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getPrisma } from "@/lib/prisma"
import { getOrCreateTenant } from "@/lib/tenant"
import {
  formatRank,
  formatRunStatus,
  getBrandRank,
  getVisibilityScore,
  mentionStatusLabel,
  providerDisplayName,
  toCompetitorViews,
} from "@/lib/monitoring/report-view"

export const dynamic = "force-dynamic"

type EvidenceSpanJson = {
  type: "brand" | "competitor" | "recommendation" | "reason"
  entity: string
  text: string
  start: number
  end: number
}

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function formatDate(value: Date | null) {
  return value ? value.toLocaleString("zh-CN", { hour12: false }) : "-"
}

function formatDuration(startedAt: Date | null, finishedAt: Date | null) {
  if (!startedAt || !finishedAt) return "-"
  const seconds = Math.max(0, Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000))
  if (seconds < 60) return `${seconds} 秒`
  return `${Math.floor(seconds / 60)} 分 ${seconds % 60} 秒`
}

function generateSuggestions({
  mentionStatus,
  reasonTags,
  queryText,
}: {
  mentionStatus: string
  reasonTags: string[]
  queryText: string
}) {
  if (mentionStatus === "RECOMMENDED") {
    return [
      {
        title: "继续强化已被识别的卖点",
        reason: reasonTags.length
          ? `本次 AI 已识别：${reasonTags.join("、")}。`
          : "本次已经进入推荐语境，需要巩固现有信号。",
        action: "围绕这些卖点继续补案例、问答和本地内容。",
      },
      {
        title: "增加同类问题覆盖",
        reason: "单个问题被推荐不等于稳定占位。",
        action: "扩展 5-10 个相近问法，持续监控推荐稳定性。",
      },
      {
        title: "定期监控排名变化",
        reason: "AI 推荐列表会随内容和竞品变化波动。",
        action: "保持每日或每周自动监测，关注排名是否下滑。",
      },
    ]
  }

  if (mentionStatus === "MENTIONED") {
    return [
      {
        title: "强化品牌卖点",
        reason: "AI 已知道品牌，但没有把它当成明确推荐对象。",
        action: "补充清晰的服务优势、施工标准和差异化卖点。",
      },
      {
        title: "增加第三方口碑和案例证据",
        reason: "推荐强度不足通常是可验证证据不够。",
        action: "补真实业主案例、评价截图、施工过程记录和平台信息。",
      },
      {
        title: "制作竞品对比内容",
        reason: "AI 容易在对比语境里形成推荐判断。",
        action: "做本地装修公司对比页，明确适合人群、价格和工艺差异。",
      },
    ]
  }

  const suggestions = [
    {
      title: "补充品牌介绍页 / 本地服务页",
      reason: "AI 没有自然提到品牌，说明基础实体信号不足。",
      action: "建立围绕地区、行业、品牌名的清晰介绍内容。",
    },
    {
      title: "补充真实案例页",
      reason: "本地服务推荐通常需要案例作为可信证据。",
      action: "整理完工案例、施工过程、预算范围和业主反馈。",
    },
    {
      title: "补充 FAQ 问答页",
      reason: "AI 更容易引用结构化问答内容。",
      action: "围绕价格、工期、材料、售后、避坑做问答内容。",
    },
  ]

  if (queryText.includes("透明工地")) {
    suggestions[2] = {
      title: "补充透明工地专题页",
      reason: "当前问题包含透明工地，但 AI 没有识别到你的品牌。",
      action: "集中展示施工直播、节点验收、工地日报和材料进场记录。",
    }
  }

  if (queryText.includes("旧房改造")) {
    suggestions[1] = {
      title: "补充旧房改造案例页",
      reason: "当前问题包含旧房改造，需要专项案例建立相关性。",
      action: "整理拆改、水电、防水、收纳和预算前后对比案例。",
    }
  }

  return suggestions
}

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const tenant = await getOrCreateTenant()
  const prisma = getPrisma()
  const run = await prisma.queryRun.findFirst({
    where: {
      id,
      query: {
        tenantId: tenant.id,
      },
    },
    include: {
      query: true,
      batch: true,
      analysis: true,
      providerAttempts: {
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!run) notFound()

  const brandProfile = await prisma.brandProfile.findUnique({
    where: { tenantId: tenant.id },
  })
  const analysis = run.analysis
  const competitors = toCompetitorViews({
    competitorsJson: analysis?.competitorsJson,
    fallbackCompetitors: run.competitors,
  })
  const evidenceSpans = toArray<EvidenceSpanJson>(analysis?.evidenceSpansJson)
  const reasonTags = analysis?.reasonTags ?? []
  const suggestions = generateSuggestions({
    mentionStatus: analysis?.mentionStatus ?? "NONE",
    reasonTags,
    queryText: run.query.text,
  })

  // Determine if the prompt included the brand name (outside of brand-awareness queries)
  const brandAliases = [
    tenant.brandName,
    ...(brandProfile?.brandAliases ?? []),
    ...(analysis?.brandAliasesMatched ?? []),
  ].filter(Boolean) as string[]
  const promptIncludesBrand = brandAliases.some((alias) => run.prompt.includes(alias))
  const brandMentioned = analysis?.brandMentioned ?? run.mentioned
  const brandRank = getBrandRank(run)
  const visibilityScore = getVisibilityScore(run)

  const highlights = [
    ...(analysis?.brandAliasesMatched ?? (tenant.brandName ? [tenant.brandName] : [])).map(
      (text) => ({ text, type: "brand" as const })
    ),
    ...competitors.map((competitor) => ({
      text: competitor.name,
      type: "competitor" as const,
    })),
    ...evidenceSpans
      .filter((span) => span.type === "recommendation")
      .map((span) => ({
        text: span.text,
        type: "recommendation" as const,
      })),
  ]

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/queries">返回关键词监测</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/dashboard/batches/${run.batchId}`}>返回批次</Link>
            </Button>
          </div>
          <h1 className="text-3xl font-semibold">{run.query.text}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            品牌：{tenant.brandName ?? "未设置品牌"} ·
            {providerDisplayName(run.provider)} / {run.model} ·
            批次：{run.batchId}
          </p>
          <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
            <p>开始：{formatDate(run.startedAt)}</p>
            <p>结束：{formatDate(run.finishedAt)}</p>
            <p>耗时：{formatDuration(run.startedAt, run.finishedAt)}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <QueryRunStatusBadge status={run.status} />
          <Badge variant="outline">{formatRunStatus(run.status)}</Badge>
        </div>
      </header>

      {/* Prompt display section - shows exactly what was sent to AI */}
      <Card>
        <CardHeader>
          <CardTitle>发送给 AI 的问题</CardTitle>
          <CardDescription>
            本次实际发送给 AI 的原始 prompt，不包含任何额外品牌引导。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-muted/40 p-4">
            <p className="font-mono text-base">{run.prompt}</p>
          </div>
          {!promptIncludesBrand ? (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
              <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-green-500" />
              本次为自然提问，未提前向 AI 提供品牌名。
            </div>
          ) : run.query.intentType !== "BRAND_AWARENESS" ? (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300">
              <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-yellow-500" />
              注意：该问题可能不属于自然推荐测试。
            </div>
          ) : null}
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>是否自然提及</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {brandMentioned ? "已提及" : "未自然提及"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>推荐状态</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {mentionStatusLabel(run)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>品牌排名</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatRank(brandRank)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>可见度分</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {visibilityScore ?? "-"}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>完整 AI 回答</CardTitle>
            <CardDescription>品牌和竞品会在原文中高亮。</CardDescription>
          </CardHeader>
          <CardContent>
            {!brandMentioned ? (
              <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                本回答没有自然提及当前品牌。
              </p>
            ) : null}
            {run.rawOutput ? (
              <RunRawOutputViewer rawOutput={run.rawOutput} highlights={highlights} />
            ) : (
              <p className="text-sm text-muted-foreground">这条运行没有 AI 回答原文。</p>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>结构化分析</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              {analysis ? (
                <div className="flex flex-col gap-3">
                  <div className="grid gap-2 text-sm md:grid-cols-2">
                    <p><span className="text-muted-foreground">提及状态：</span>{mentionStatusLabel(run)}</p>
                    <p><span className="text-muted-foreground">排名类型：</span>{analysis.rankType === "EXPLICIT" ? "明确排名" : analysis.rankType === "IMPLIED" ? "隐含排名" : analysis.rankType === "UNRANKED" ? "未识别排名" : "无排名"}</p>
                    <p><span className="text-muted-foreground">解析可信度：</span>{Math.round(analysis.parserConfidence * 100)}%</p>
                    <p><span className="text-muted-foreground">影响等级：</span>{analysis.impactLevel === "POSITIVE" ? "正面" : analysis.impactLevel === "NEGATIVE" ? "负面" : "中性"}</p>
                    <p><span className="text-muted-foreground">解析器版本：</span>{analysis.parserVersion}</p>
                    <p>
                      <span className="text-muted-foreground">命中品牌别名：</span>
                      {analysis.brandAliasesMatched.length
                        ? analysis.brandAliasesMatched.join("、")
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">归因标签</p>
                    <div className="flex flex-wrap gap-1">
                      {reasonTags.length ? reasonTags.map((tag) => (
                        <span key={tag} className="rounded-full border px-2 py-0.5 text-xs">{tag}</span>
                      )) : <span className="text-muted-foreground text-xs">-</span>}
                    </div>
                  </div>
                  {analysis.summary ? (
                    <p className="rounded-lg bg-muted/40 p-3 text-sm">{analysis.summary}</p>
                  ) : null}
                  <details className="rounded-lg border p-3">
                    <summary className="cursor-pointer font-medium">证据片段</summary>
                    <pre className="mt-3 overflow-auto text-xs whitespace-pre-wrap">
                      {JSON.stringify(analysis.evidenceSpansJson, null, 2)}
                    </pre>
                  </details>
                  <details className="rounded-lg border p-3">
                    <summary className="cursor-pointer font-medium">来源引用</summary>
                    <pre className="mt-3 overflow-auto text-xs whitespace-pre-wrap">
                      {JSON.stringify(analysis.citationsJson, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-muted-foreground">
                    这条监测结果尚未生成结构化分析。
                  </p>
                  {run.status === "SUCCESS" ? <AnalyzeRunButton runId={run.id} /> : null}
                  {run.status === "SUCCESS" ? <GenerateContentTasksButton runId={run.id} /> : null}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>优化建议</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {suggestions.map((suggestion) => (
                <div key={suggestion.title} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">{suggestion.title}</p>
                  <p className="mt-1 text-muted-foreground">原因：{suggestion.reason}</p>
                  <p className="mt-1">动作：{suggestion.action}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>竞品列表</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {competitors.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              本回答没有识别到明确竞品。
            </p>
          ) : (
            competitors.map((competitor) => (
              <div key={competitor.name} className="rounded-lg border p-3 text-sm">
                <p className="font-medium">{competitor.name}</p>
                <p className="text-muted-foreground">
                  排名：{formatRank(competitor.rank)} · 推荐：
                  {competitor.recommended ? "是" : "否"}
                </p>
                <p className="mt-2 text-muted-foreground">{competitor.evidence}</p>
                {competitor.reasonTags.length ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {competitor.reasonTags.map((tag) => (
                      <span key={tag} className="rounded-full border px-2 py-0.5 text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>运行信息</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">创建时间</span>
            <p>{formatDate(run.createdAt)}</p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">开始时间</span>
            <p>{formatDate(run.startedAt)}</p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">完成时间</span>
            <p>{formatDate(run.finishedAt)}</p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">批次 ID</span>
            <p><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{run.batchId}</code></p>
          </div>
        </CardContent>
      </Card>

      <details className="rounded-xl border p-4 text-sm">
        <summary className="cursor-pointer font-medium">技术信息</summary>
        <div className="mt-4 grid gap-4">
          <pre className="overflow-auto rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap">
            {JSON.stringify(
              {
                prompt: run.prompt,
                promptHash: run.promptHash ?? "-",
                parserVersion: analysis?.parserVersion ?? "-",
                surface: run.surface,
                errorMessage: run.errorMessage ?? "-",
              },
              null,
              2
            )}
          </pre>
          <div className="grid gap-2">
            {run.providerAttempts.map((attempt) => (
              <div key={attempt.id} className="rounded-lg border p-3">
                <p>
                  <span className="font-medium">第 {attempt.attemptNo} 次调用</span> · {providerDisplayName(attempt.provider)} / {attempt.model}
                </p>
                <div className="mt-2 grid gap-1 text-muted-foreground md:grid-cols-3">
                  <p>延迟：{attempt.latencyMs ? `${attempt.latencyMs} ms` : "-"}</p>
                  <p>HTTP 状态：{attempt.httpStatus ?? "-"}</p>
                  <p>输入 Token：{attempt.inputTokens ?? "-"}</p>
                  <p>输出 Token：{attempt.outputTokens ?? "-"}</p>
                  <p>总 Token：{attempt.totalTokens ?? "-"}</p>
                  <p>预估费用：{attempt.estimatedCostCny ? `¥${attempt.estimatedCostCny}` : "-"}</p>
                </div>
                {attempt.errorCode || attempt.errorMessage ? (
                  <div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">
                    {attempt.errorCode ? <p>错误码：{attempt.errorCode}</p> : null}
                    {attempt.errorMessage ? <p>错误信息：{attempt.errorMessage}</p> : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </details>
    </div>
  )
}
