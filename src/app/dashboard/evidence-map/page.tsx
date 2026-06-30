import Link from "next/link"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DEFAULT_EVIDENCE_COMPETITORS,
  type EvidenceGap,
  type EvidenceMapItem,
  type EvidencePriority,
  type EvidenceSourceType,
  extractEvidenceMap,
} from "@/lib/evidence/extract-evidence-map"
import {
  type AnswerSourceDraft,
  extractAnswerSources,
} from "@/lib/evidence/extract-answer-sources"
import {
  type RepairTaskDraft,
  mapEvidenceGapToRepairTask,
} from "@/lib/evidence/map-evidence-gap-to-repair-task"
import {
  type ContentBacklogTaskDraft,
  mapRepairTaskToContentTask,
} from "@/lib/evidence/map-repair-task-to-content-task"
import {
  type BrandMentionChange,
  type EvidenceChange,
  type EvidenceRunComparison,
  compareEvidenceRuns,
} from "@/lib/evidence/compare-evidence-runs"
import {
  type EvidenceConfidenceLabel,
  type EvidenceConfidenceLevel,
  classifyEvidenceConfidence,
} from "@/lib/evidence/classify-evidence-confidence"
import { getPrisma } from "@/lib/prisma"
import { getOrCreateTenant } from "@/lib/tenant"

export const dynamic = "force-dynamic"

type EvidenceMapRow = EvidenceMapItem & {
  id: string
  queryId: string
  runId: string
  intentType: string
  runCreatedAt: Date
  answerSources: AnswerSourceDraft[]
  repairTask: RepairTaskDraft
  contentTaskDraft: ContentBacklogTaskDraft
  previousRunId: string | null
  previousRunCreatedAt: Date | null
  comparison: EvidenceRunComparison
  confidenceLabel: EvidenceConfidenceLabel
}

const sourceTypeLabels: Record<EvidenceSourceType, string> = {
  business_registry: "工商信息",
  short_video: "短视频",
  xiaohongshu: "小红书",
  zhihu: "知乎",
  wechat: "微信/公众号",
  official_site: "官网/网站",
  local_listing: "本地地图",
  authority_media: "权威媒体",
  unknown: "未知来源",
}

const evidenceGapLabels: Record<EvidenceGap, string> = {
  competitor_evidence_advantage: "竞品证据优势",
  missing_citable_brand_evidence: "缺少可引用品牌证据",
  weak_brand_definition: "品牌定义偏弱",
  no_major_gap: "暂无高优先级缺口",
}

const intentLabels: Record<string, string> = {
  NATURAL_RECOMMENDATION: "自然推荐",
  BRAND_AWARENESS: "品牌认知",
  FEATURE: "功能/卖点",
  OLD_HOUSE: "旧房改造",
  BUDGET: "预算",
  SELECTION_GUIDE: "选择攻略",
  OTHER: "其他",
}

const repairTaskTypeLabels: Record<RepairTaskDraft["taskType"], string> = {
  page_update: "页面更新",
  new_page: "新建页面",
  faq_addition: "FAQ 补充",
  schema_fix: "结构化修复",
  third_party_profile: "第三方资料",
  review_collection: "评价收集",
  authority_building: "权威背书",
  sentiment_defense: "舆情防御",
  competitor_counter: "竞品反制",
}

const contentTaskTypeLabels: Record<ContentBacklogTaskDraft["type"], string> = {
  ARTICLE: "文章",
  FAQ: "常见问题",
  CASE_PAGE: "案例页",
  COMPARISON: "对比分析",
  LOCAL_SERVICE_PAGE: "服务介绍",
  LLMSTXT: "LLMs.txt",
  SCHEMA: "结构化数据",
  SOCIAL_POST: "社媒内容",
}

const evidenceChangeLabels: Record<EvidenceChange, string> = {
  improved: "改善",
  worsened: "恶化",
  unchanged: "无变化",
  unknown: "数据不足",
}

const brandMentionChangeLabels: Record<BrandMentionChange, string> = {
  gained: "新增提及",
  lost: "丢失提及",
  unchanged_positive: "持续提及",
  unchanged_negative: "持续未提及",
  unknown: "数据不足",
}

const confidenceLevelLabels: Record<EvidenceConfidenceLevel, string> = {
  high: "高置信命中",
  medium: "中置信推断",
  low: "低置信 / 数据不足",
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function unique(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)))
}

function namesFromUnknownJson(value: unknown): string[] {
  if (!value) return []

  if (typeof value === "string") {
    try {
      return namesFromUnknownJson(JSON.parse(value))
    } catch {
      return value
        .split(/[，,、]/)
        .map((item) => item.trim())
        .filter(Boolean)
    }
  }

  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    if (typeof item === "string") return [item]
    if (item && typeof item === "object" && "name" in item) {
      const name = (item as { name?: unknown }).name
      return typeof name === "string" ? [name] : []
    }
    return []
  })
}

function priorityClass(priority: EvidencePriority) {
  if (priority === "P0") return "border-red-200 bg-red-50 text-red-700"
  if (priority === "P1") return "border-amber-200 bg-amber-50 text-amber-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

function changeClass(change: EvidenceChange) {
  if (change === "improved") return "border-green-200 bg-green-50 text-green-700"
  if (change === "worsened") return "border-red-200 bg-red-50 text-red-700"
  if (change === "unchanged") return "border-slate-200 bg-slate-50 text-slate-700"
  return "border-amber-200 bg-amber-50 text-amber-700"
}

function confidenceClass(level: EvidenceConfidenceLevel) {
  if (level === "high") return "border-green-200 bg-green-50 text-green-700"
  if (level === "medium") return "border-amber-200 bg-amber-50 text-amber-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

function formatDate(value: Date) {
  return value.toLocaleString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

async function getEvidenceMapPageData() {
  const tenant = await getOrCreateTenant()
  const prisma = getPrisma()

  const [queryCount, latestRuns] = await Promise.all([
    prisma.query.count({ where: { tenantId: tenant.id } }),
    prisma.queryRun.findMany({
      where: {
        query: { tenantId: tenant.id },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        query: true,
        analysis: true,
      },
    }),
  ])
  const brandProfile = await prisma.brandProfile.findUnique({
    where: { tenantId: tenant.id },
  })

  const runsByQuery = new Map<string, Array<(typeof latestRuns)[number]>>()
  for (const run of latestRuns) {
    const runs = runsByQuery.get(run.queryId) ?? []
    runs.push(run)
    runsByQuery.set(run.queryId, runs)
  }

  const brandName = tenant.brandName ?? tenant.name

  function buildEvidenceItem(run: (typeof latestRuns)[number]) {
    const analysis = run.analysis
    const competitors = unique([
      ...DEFAULT_EVIDENCE_COMPETITORS,
      ...run.competitors,
      ...namesFromUnknownJson(analysis?.competitorsJson),
    ])
    const answer = [run.rawOutput, analysis?.summary, run.notes].filter(isString).join("\n\n")
    const item = extractEvidenceMap({
      query: run.query.text,
      answer,
      brandName,
      competitors,
    })[0]
    const answerSources = extractAnswerSources({
      citationsJson: analysis?.citationsJson,
      answer: run.rawOutput,
      summary: analysis?.summary,
      ownedDomains: [brandProfile?.siteUrl ?? ""],
      competitorNames: competitors,
    })
    const sourceTypes = Array.from(
      new Set<EvidenceSourceType>([
        ...item.sourceTypes,
        ...answerSources.map((source) => source.sourceType),
      ])
    )
    const evidenceItem = {
      ...item,
      sourceTypes,
    }

    return {
      evidenceItem,
      answerSources,
      answer,
    }
  }

  const rows: EvidenceMapRow[] = Array.from(runsByQuery.values()).map((runs) => {
    const run = runs[0]
    const previousRun = runs[1] ?? null
    const { evidenceItem, answerSources, answer } = buildEvidenceItem(run)
    const previousEvidenceItem = previousRun ? buildEvidenceItem(previousRun).evidenceItem : null

    const repairTask = mapEvidenceGapToRepairTask(evidenceItem)
    const contentTaskDraft = mapRepairTaskToContentTask(repairTask)
    const comparison = compareEvidenceRuns({
      previous: previousEvidenceItem,
      current: evidenceItem,
    })
    const confidenceLabel = classifyEvidenceConfidence({
      evidenceItem,
      answerSources,
      answer,
      citationsJson: run.analysis?.citationsJson,
      comparison,
    })

    return {
      ...evidenceItem,
      id: run.id,
      queryId: run.queryId,
      runId: run.id,
      intentType: run.query.intentType,
      runCreatedAt: run.createdAt,
      answerSources,
      repairTask,
      contentTaskDraft,
      previousRunId: previousRun?.id ?? null,
      previousRunCreatedAt: previousRun?.createdAt ?? null,
      comparison,
      confidenceLabel,
    }
  })

  return {
    tenant,
    queryCount,
    rows,
    summary: {
      unmentionedCount: rows.filter((row) => !row.brandMentioned).length,
      competitorMentionedCount: rows.filter((row) => row.competitorsMentioned.length > 0).length,
      p0Count: rows.filter((row) => row.priority === "P0").length,
      improvedCount: rows.filter((row) => row.comparison.overallChange === "improved").length,
      worsenedCount: rows.filter((row) => row.comparison.overallChange === "worsened").length,
      unchangedCount: rows.filter((row) => row.comparison.overallChange === "unchanged").length,
      unknownCount: rows.filter((row) => row.comparison.overallChange === "unknown").length,
    },
  }
}

export default async function EvidenceMapPage() {
  let data: Awaited<ReturnType<typeof getEvidenceMapPageData>> | null = null
  let errorMsg: string | null = null

  try {
    data = await getEvidenceMapPageData()
  } catch (err) {
    console.error("[EvidenceMap] getEvidenceMapPageData failed:", err)
    errorMsg = err instanceof Error ? err.message : String(err)
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-6 p-6 md:p-8">
        <header>
          <h1 className="text-3xl font-semibold">AI 答案证据链</h1>
          <p className="mt-2 text-muted-foreground">
            看清楚哪些问题没提到你、AI 信了哪些来源、你该优先改哪一页。
          </p>
        </header>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p className="font-medium">数据加载失败</p>
          <p className="mt-1">{errorMsg ?? "未知错误，请刷新页面重试"}</p>
        </div>
      </div>
    )
  }

  const { tenant, queryCount, rows, summary } = data

  return (
    <div className="flex flex-col gap-8 p-6 md:p-8">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h1 className="text-3xl font-semibold">AI 答案证据链</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            看清楚哪些问题没提到你、AI 信了哪些来源、系统推断你该优先改哪一页。
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            品牌：{tenant.brandName ?? "未设置品牌"} · 企业空间：{tenant.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/dashboard/queries">管理关键词</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">返回总览</Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <DashboardStatCard label="总问题数" value={queryCount} />
        <DashboardStatCard label="未提及品牌" value={summary.unmentionedCount} />
        <DashboardStatCard label="提及竞品" value={summary.competitorMentionedCount} />
        <DashboardStatCard label="P0 修复机会" value={summary.p0Count} />
      </section>

      {rows.length > 0 ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">答案变化趋势</h2>
            <p className="text-sm text-muted-foreground">
              基于同一个 Query 最近两次 Monitoring 的系统推断结果对比；数据不足表示样本还不够，不代表修复失败。
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-md border px-4 py-3">
              <div className="text-sm text-muted-foreground">改善</div>
              <div className="mt-1 text-2xl font-semibold text-green-700">
                {summary.improvedCount}
              </div>
            </div>
            <div className="rounded-md border px-4 py-3">
              <div className="text-sm text-muted-foreground">恶化</div>
              <div className="mt-1 text-2xl font-semibold text-red-700">
                {summary.worsenedCount}
              </div>
            </div>
            <div className="rounded-md border px-4 py-3">
              <div className="text-sm text-muted-foreground">无变化</div>
              <div className="mt-1 text-2xl font-semibold">{summary.unchangedCount}</div>
            </div>
            <div className="rounded-md border px-4 py-3">
              <div className="text-sm text-muted-foreground">数据不足</div>
              <div className="mt-1 text-2xl font-semibold text-amber-700">
                {summary.unknownCount}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {rows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>还没有可分析的数据</CardTitle>
            <CardDescription>
              请先添加 Query 并运行一次 Monitoring，系统会在这里生成 AI 答案证据链。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/dashboard/queries">去添加 Query</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">查看监测总览</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Query Evidence Table</CardTitle>
            <CardDescription>
              基于每个 Query 最近一次监测结果派生，当前为启发式系统推断，不写入数据库；该判断基于当前可用答案与来源信息，不代表平台官方归因。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Query</TableHead>
                  <TableHead>品牌是否提及</TableHead>
                  <TableHead>竞品提及</TableHead>
                  <TableHead>来源类型</TableHead>
                  <TableHead>证据缺口</TableHead>
                  <TableHead>建议页面</TableHead>
                  <TableHead>建议修复任务</TableHead>
                  <TableHead>前后变化</TableHead>
                  <TableHead>置信度</TableHead>
                  <TableHead>优先级</TableHead>
                  <TableHead>原因</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="max-w-[18rem] whitespace-normal">
                      <Link
                        href={`/dashboard/runs/${row.runId}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {row.query}
                      </Link>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {intentLabels[row.intentType] ?? row.intentType} · {formatDate(row.runCreatedAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {row.brandMentioned ? (
                        <Badge className="bg-green-50 text-green-700">已提及</Badge>
                      ) : (
                        <Badge variant="destructive">未提及</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[12rem] whitespace-normal">
                      {row.competitorsMentioned.length ? (
                        <div className="flex flex-wrap gap-1">
                          {row.competitorsMentioned.map((competitor) => (
                            <Badge key={competitor} variant="outline">
                              {competitor}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[12rem] whitespace-normal">
                      <div className="flex flex-wrap gap-1">
                        {row.sourceTypes.map((sourceType) => (
                          <Badge key={sourceType} variant="outline">
                            {sourceTypeLabels[sourceType]}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[14rem] whitespace-normal">
                      {evidenceGapLabels[row.evidenceGap]}
                    </TableCell>
                    <TableCell className="max-w-[16rem] whitespace-normal">
                      <div className="font-medium">{row.suggestedPage}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {row.suggestedAction}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[18rem] whitespace-normal">
                      <Badge variant="outline">
                        {repairTaskTypeLabels[row.repairTask.taskType]}
                      </Badge>
                      <div className="mt-2 font-medium">{row.repairTask.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        影响：{row.repairTask.expectedImpact}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        工作量：{row.repairTask.effortLevel}
                      </div>
                      <div className="mt-3 rounded-md border border-dashed px-3 py-2 text-xs">
                        <div className="font-medium">可进入修复任务池</div>
                        <div className="mt-1 text-muted-foreground">
                          映射为：{contentTaskTypeLabels[row.contentTaskDraft.type]} · 优先级{" "}
                          {row.contentTaskDraft.priority}
                        </div>
                        <Link
                          href="/dashboard/content-backlog"
                          className="mt-2 inline-flex text-primary underline-offset-2 hover:underline"
                        >
                          查看任务池
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[20rem] whitespace-normal">
                      <Badge
                        className={changeClass(row.comparison.overallChange)}
                        variant="outline"
                      >
                        {evidenceChangeLabels[row.comparison.overallChange]}
                      </Badge>
                      {row.previousRunId ? (
                        <>
                          <div className="mt-2 text-xs text-muted-foreground">
                            上次：{formatDate(row.previousRunCreatedAt!)} · 本次：
                            {formatDate(row.runCreatedAt)}
                          </div>
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            <div>
                              品牌：{brandMentionChangeLabels[row.comparison.brandMentionChange]}
                            </div>
                            <div>
                              竞品：{evidenceChangeLabels[row.comparison.competitorChangeSummary]}
                            </div>
                            <div>
                              来源：{evidenceChangeLabels[row.comparison.sourceTypeChangeSummary]}
                            </div>
                            <div>
                              缺口：{evidenceChangeLabels[row.comparison.gapChange]}
                            </div>
                          </div>
                          <div className="mt-2 text-xs">{row.comparison.reason}</div>
                        </>
                      ) : (
                        <div className="mt-2 text-xs text-muted-foreground">
                          暂无历史对比。完成下一次 Monitoring 后，这里会显示答案变化。
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[16rem] whitespace-normal">
                      <Badge
                        className={confidenceClass(row.confidenceLabel.confidenceLevel)}
                        variant="outline"
                      >
                        {confidenceLevelLabels[row.confidenceLabel.confidenceLevel]}
                      </Badge>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {row.confidenceLabel.confidenceScore}%
                      </div>
                      <div className="mt-2 text-xs">
                        {row.confidenceLabel.reasons[0]}
                      </div>
                      {row.confidenceLabel.warnings[0] ? (
                        <div className="mt-1 text-xs text-amber-700">
                          {row.confidenceLabel.warnings[0]}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityClass(row.priority)} variant="outline">
                        {row.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[22rem] whitespace-normal">
                      <div>{row.reason}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        可信度：{Math.round(row.confidence * 100)}%
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
