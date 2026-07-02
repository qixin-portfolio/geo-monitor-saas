import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, FileText, Lightbulb, Search, Sparkles, Target } from "lucide-react"

import { getPrisma } from "@/lib/prisma"
import { getOrCreateTenant } from "@/lib/tenant"
import {
  REPAIR_TASK_RISK_LABELS,
  REPAIR_TASK_TYPE_LABELS,
  buildRepairTaskWorkbenchViewModel,
  type RepairTaskRiskLevel,
} from "@/lib/content-backlog/repair-task-workbench"

import { TaskActions } from "./task-actions"

export const dynamic = "force-dynamic"

const TYPE_LABELS: Record<string, string> = {
  ARTICLE: "文章",
  FAQ: "常见问题",
  CASE_PAGE: "案例页",
  COMPARISON: "对比分析",
  LOCAL_SERVICE_PAGE: "服务介绍",
  LLMSTXT: "LLMs.txt",
  SCHEMA: "结构化数据",
  SOCIAL_POST: "小红书笔记",
}

const STATUS_LABELS: Record<string, string> = {
  TODO: "待办",
  BRIEF_READY: "简报已就绪",
  DRAFT_READY: "草稿已就绪",
  REVIEW_NEEDED: "待审核",
  APPROVED: "已批准",
  EXPORTED: "已导出",
  SKIPPED: "已跳过",
}

const RISK_CLASS_NAMES: Record<RepairTaskRiskLevel, string> = {
  GREEN: "border-emerald-200 bg-emerald-50 text-emerald-700",
  YELLOW: "border-amber-200 bg-amber-50 text-amber-700",
  RED: "border-red-200 bg-red-50 text-red-700",
}

const EVIDENCE_TYPE_LABELS: Record<string, string> = {
  brand: "品牌证据",
  competitor: "竞品证据",
  ranking: "排名证据",
  citation: "引用证据",
  reason: "推荐理由",
  evidence: "证据片段",
  unknown: "证据片段",
}

const REASON_TAG_LABELS: Record<string, string> = {
  "本地口碑": "本地口碑",
  "工地考察": "工地考察",
  "报价对比": "报价对比",
  "合同规范": "合同规范",
  "过程透明": "过程透明",
  "案例证明": "案例证明",
  "售后保障": "售后保障",
}

type BriefJson = {
  audience?: string
  searchIntent?: string
  angle?: string
  differentiationTargets?: string[]
  forbiddenClaims?: string[]
  evidenceNeeded?: string[]
  outline?: string[]
  internalLinks?: string[]
  llmsNotes?: string[]
}

type EvidenceSpan = {
  type?: string
  entity?: string
  text?: string
  start?: number
  end?: number
}

type CompetitorDetail = {
  name?: string
  rank?: number | null
  evidence?: string
  reasonTags?: string[]
  recommended?: boolean
}

type TaskEvidence = {
  summary?: string
  trigger?: string
  mentionStatus?: string
  rankType?: string
  brandRank?: number | null
  reasonTags?: string[]
  competitors?: string[]
  evidenceSpans?: EvidenceSpan[]
  brandMentioned?: boolean
  visibilityScore?: number
  parserConfidence?: number
}

function safeText(value: unknown, fallback = "暂未补充") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function formatDate(value: Date | null | undefined) {
  return value ? value.toLocaleString("zh-CN", { hour12: false }) : "暂未记录"
}

function formatPercent(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) return "暂未识别"
  return `${Math.round(value)} 分`
}

function formatPriority(value: number) {
  if (value >= 80) return `高（${value}）`
  if (value >= 55) return `中（${value}）`
  return `低（${value}）`
}

function summarizeAnswer(value: string | null | undefined) {
  if (!value) return "这条任务还没有可读的 AI 回答摘要。"
  const lines = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3)
  const summary = lines.join(" ")
  if (!summary) return "这条任务还没有可读的 AI 回答摘要。"
  return summary.length > 220 ? `${summary.slice(0, 220)}...` : summary
}

function mentionStatusLabel(value: string | null | undefined, brandName: string) {
  if (value === "RECOMMENDED") return `${brandName}已经进入 AI 推荐位`
  if (value === "MENTIONED") return `AI 提到了 ${brandName}，但还没有明确推荐`
  return `AI 还没有自然提到 ${brandName}`
}

function rankTypeLabel(value: string | null | undefined) {
  if (value === "EXPLICIT") return "有明确排名"
  if (value === "IMPLIED") return "有推荐倾向，但没写出排名"
  if (value === "UNRANKED") return "提到了品牌，但没给推荐位"
  return "没有进入推荐语境"
}

function impactLevelLabel(value: string | null | undefined) {
  if (value === "POSITIVE") return "正向：这类问题对品牌有帮助"
  if (value === "NEUTRAL") return "中性：品牌被知道，但优势不够强"
  if (value === "NEGATIVE") return "负向：品牌没被带进推荐答案"
  return "暂未识别"
}

function getEvidenceJson(value: unknown): TaskEvidence {
  if (!value || typeof value !== "object") return {}
  return value as TaskEvidence
}

function getEvidenceSpans(value: unknown) {
  return safeArray<EvidenceSpan>(value).filter(
    (item) => typeof item?.text === "string" && item.text.trim()
  )
}

function uniqueEvidenceSpans(values: EvidenceSpan[]) {
  const seen = new Set<string>()
  const result: EvidenceSpan[] = []

  for (const span of values) {
    const key = `${span.entity || ""}:${span.text || ""}`
    if (seen.has(key)) continue
    seen.add(key)
    result.push(span)
  }

  return result
}

function getCompetitorNames(value: unknown) {
  return Array.from(
    new Set(
      safeArray<unknown>(value)
        .map((item) => {
          if (typeof item === "string") return item.trim()
          if (item && typeof item === "object" && "name" in item) {
            const name = (item as { name?: unknown }).name
            return typeof name === "string" ? name.trim() : ""
          }
          return ""
        })
        .filter(Boolean)
    )
  )
}

function getCompetitorDetails(value: unknown) {
  return safeArray<CompetitorDetail>(value).filter(
    (item) => typeof item?.name === "string" && item.name.trim()
  )
}

function getBrandProblemText({
  mentionStatus,
  visibilityScore,
  competitors,
  brandName,
}: {
  mentionStatus: string | null | undefined
  visibilityScore: number | null | undefined
  competitors: string[]
  brandName: string
}) {
  if (mentionStatus === "RECOMMENDED") {
    return `${brandName}已经进入推荐位，这条任务更像是“继续巩固优势”，不是从 0 到 1 的补救。`
  }
  if (mentionStatus === "MENTIONED") {
    return `AI 已经知道 ${brandName}，但还没把它当成明确推荐对象。说明品牌有认知，但缺少让 AI 觉得“可以放心推荐”的证据。`
  }
  if ((visibilityScore ?? 0) <= 0 && competitors.length > 0) {
    return `AI 直接给了竞品答案，没有把 ${brandName} 放进候选名单。这通常说明本地案例、卖点解释、可验证证据还不够强。`
  }
  return `当前问题下 ${brandName} 的可见度偏低，AI 还没有形成稳定推荐判断。`
}

function getExpectedOutcomes({
  type,
  brandName,
  targetKeyword,
}: {
  type: string
  brandName: string
  targetKeyword: string
}) {
  switch (type) {
    case "ARTICLE":
      return [
        `让 AI 在回答“${targetKeyword}”时，更容易引用 ${brandName} 的本地解释和选择标准。`,
        "把品牌从“没出现”往“被提及、被比较”推进一步。",
      ]
    case "COMPARISON":
      return [
        `让 AI 更清楚 ${brandName} 和本地竞品之间的差异。`,
        "减少竞品单方面占据推荐位的情况。",
      ]
    case "FAQ":
      return [
        `让 AI 有更结构化的问答素材可引用。`,
        `强化 ${brandName} 的解释力，而不是只停留在名字被提到。`,
      ]
    case "CASE_PAGE":
      return [
        "补上真实案例证据，提升自然推荐的可信度。",
        "让旧房改造、翻新类问题更容易带出品牌。",
      ]
    case "LOCAL_SERVICE_PAGE":
      return [
        "把服务场景、适合人群和核心卖点讲透。",
        "让 AI 更容易理解品牌在本地场景里的具体价值。",
      ]
    default:
      return ["补齐 AI 容易读取和引用的内容资产。", "让品牌信息更完整、更可比较。"]
  }
}

function getTaskGuide({
  type,
  brandName,
  region,
  industry,
  targetKeyword,
  sourceQuery,
  competitors,
}: {
  type: string
  brandName: string
  region: string
  industry: string
  targetKeyword: string
  sourceQuery: string
  competitors: string[]
}) {
  if (type === "ARTICLE") {
    return {
      title: "建议补充的内容",
      blocks: [
        {
          label: "推荐文章标题",
          items: [
            `《${sourceQuery}》`,
            `《${region}${industry}怎么选：从案例、服务说明和可信证据看》`,
          ],
        },
        {
          label: "文章结构",
          items: [
            "先解释用户为什么会问这个问题",
            `再给出 ${region}${industry} 方案的筛选标准`,
            `补充 ${brandName} 在案例、资质、服务流程上的证据`,
            "最后给用户一个实际决策建议",
          ],
        },
        {
          label: "必须包含的本地关键词",
          items: uniqueNonEmpty([targetKeyword, `${region}${industry}`, `${region}服务商`]),
        },
      ],
    }
  }

  if (type === "COMPARISON") {
    return {
      title: "建议补充的内容",
      blocks: [
        {
          label: "对比对象",
          items: competitors.length > 0 ? competitors : ["本地主要竞品"],
        },
        {
          label: "对比维度",
          items: ["服务边界", "真实案例", "资质证明", "交付流程", "适合人群"],
        },
        {
          label: "建议标题",
          items: [`《${brandName}和${competitors[0] || "本地服务商"}怎么选》`],
        },
      ],
    }
  }

  if (type === "FAQ") {
    return {
      title: "建议补充的内容",
      blocks: [
        {
          label: "建议问题",
          items: [
            `${brandName} 在 ${region} 主要提供哪些服务？`,
            `${brandName} 有哪些可验证的案例或资质？`,
            `${brandName} 的服务流程和售后边界怎么安排？`,
          ],
        },
        {
          label: "回答方向",
          items: ["把服务范围讲清楚", "把流程讲清楚", "把真实案例和验证方式讲清楚"],
        },
      ],
    }
  }

  if (type === "CASE_PAGE") {
    return {
      title: "建议补充的内容",
      blocks: [
        {
          label: "推荐案例主题",
          items: [`${region}${industry}真实案例`, `${region}${industry}前后对比案例`],
        },
        {
          label: "案例应包含的信息",
          items: ["项目背景", "原始问题", "执行节点", "投入范围", "完成效果", "客户反馈"],
        },
      ],
    }
  }

  if (type === "LOCAL_SERVICE_PAGE") {
    return {
      title: "建议补充的内容",
      blocks: [
        {
          label: "服务页主题",
          items: [`${region}${industry}服务说明`, `${brandName}${region}${industry}服务页`],
        },
        {
          label: "应覆盖的服务范围和场景",
          items: ["核心服务", "适用场景", "交付流程", "资质证明", "案例证据", "售后保障"],
        },
      ],
    }
  }

  return {
    title: "建议补充的内容",
    blocks: [
      {
        label: "建议方向",
        items: ["补真实案例", "补服务说明", "补常见问题", "补对比内容"],
      },
    ],
  }
}

function uniqueNonEmpty(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function getTriggerLabel(trigger: string | undefined) {
  if (!trigger) return "监测结果自动触发"
  if (trigger === "natural-query-not-recommended") return "自然推荐问题里没有进入推荐位"
  if (trigger === "competitors-more-visible-than-brand") return "竞品在 AI 回答里更显眼"
  if (trigger === "transparent-site-query") return "过程透明相关问题需要专门补内容"
  if (trigger === "renovation-case-query") return "旧房/翻新类问题缺少案例证据"
  if (trigger === "mentioned-but-not-recommended") return "品牌被提到，但推荐理由不够强"
  return "监测结果自动触发"
}

export default async function ContentTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const tenant = await getOrCreateTenant()
  if (!tenant) notFound()

  const prisma = getPrisma()
  const task = await prisma.geoContentTask.findUnique({
    where: { id },
  })

  if (!task || task.tenantId !== tenant.id) notFound()

  const runByTask = task.queryRunId
    ? await prisma.queryRun.findUnique({
        where: { id: task.queryRunId },
        include: {
          query: true,
          analysis: true,
        },
      })
    : null
  const runByAnalysis = !runByTask && task.analysisId
    ? (
        await prisma.queryRunAnalysis.findUnique({
          where: { id: task.analysisId },
          include: {
            queryRun: {
              include: {
                query: true,
                analysis: true,
              },
            },
          },
        })
      )?.queryRun ?? null
    : null
  const run = runByTask ?? runByAnalysis

  const brief = (task.briefJson as BriefJson | null) ?? null
  const taskEvidence = getEvidenceJson(task.evidenceJson)
  const evidenceCompetitors = getCompetitorNames(taskEvidence.competitors)
  const analysisCompetitorDetails = getCompetitorDetails(run?.analysis?.competitorsJson)
  const analysisCompetitors = getCompetitorNames(run?.analysis?.competitorsJson)
  const competitors = uniqueNonEmpty([...evidenceCompetitors, ...analysisCompetitors])
  const taskEvidenceSpans = getEvidenceSpans(taskEvidence.evidenceSpans)
  const analysisEvidenceSpans = getEvidenceSpans(run?.analysis?.evidenceSpansJson)
  const evidenceSpans = uniqueEvidenceSpans([
    ...taskEvidenceSpans,
    ...analysisEvidenceSpans,
  ]).slice(0, 8)

  const brandName = safeText(tenant.brandName, "当前品牌")
  const region = safeText(tenant.region, "本地")
  const industry = safeText(tenant.industry, "服务")
  const targetKeyword = safeText(task.targetKeyword, safeText(task.sourceQuery, "本地服务问题"))
  const sourceQuery = safeText(run?.query.text ?? task.sourceQuery, "暂未记录原始问题")
  const answerSummary = safeText(run?.analysis?.summary, summarizeAnswer(run?.rawOutput))
  const workbench = buildRepairTaskWorkbenchViewModel(task)

  const guide = getTaskGuide({
    type: task.type,
    brandName,
    region,
    industry,
    targetKeyword,
    sourceQuery,
    competitors,
  })
  const expectedOutcomes = getExpectedOutcomes({
    type: task.type,
    brandName,
    targetKeyword,
  })

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div>
        <Link
          href="/dashboard/content-backlog"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          返回任务列表
        </Link>

        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">{task.title}</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              这是证据化修复工作台 v0.1：先解释为什么要做，再说明补什么内容，最后保留后续复测入口。
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded bg-muted px-2 py-0.5">
                {REPAIR_TASK_TYPE_LABELS[workbench.type]}
              </span>
              <span
                className={`rounded border px-2 py-0.5 ${RISK_CLASS_NAMES[workbench.riskLevel]}`}
              >
                {REPAIR_TASK_RISK_LABELS[workbench.riskLevel]}风险
              </span>
              <span className="rounded bg-muted px-2 py-0.5">
                {TYPE_LABELS[task.type] || task.type}
              </span>
              <span className="rounded bg-muted px-2 py-0.5">
                {STATUS_LABELS[task.status] || task.status}
              </span>
              <span className="text-muted-foreground">优先级 {formatPriority(task.priority)}</span>
              <span className="text-muted-foreground">创建于 {formatDate(task.createdAt)}</span>
            </div>
          </div>

          {task.queryRunId ? (
            <Link
              href={`/dashboard/runs/${task.queryRunId}`}
              className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-muted"
            >
              查看来源监测结果
            </Link>
          ) : null}
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-medium">工作台总览</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">任务类型</p>
              <p className="mt-1 font-medium">{REPAIR_TASK_TYPE_LABELS[workbench.type]}</p>
            </div>
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">风险等级</p>
              <p className="mt-1 font-medium">{REPAIR_TASK_RISK_LABELS[workbench.riskLevel]}</p>
            </div>
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">当前状态</p>
              <p className="mt-1 font-medium">{STATUS_LABELS[task.status] || task.status}</p>
            </div>
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">关联 query</p>
              <p className="mt-1 font-medium">{workbench.evidenceSummary.relatedQuery}</p>
            </div>
          </div>
          <div className="mt-3 rounded-md bg-muted/40 p-3 text-sm">
            <p className="text-xs text-muted-foreground">风险说明</p>
            <p className="mt-1">{workbench.riskReason}</p>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <h2 className="mb-3 font-medium">关联 evidence</h2>
          <div className="space-y-3 text-sm">
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Evidence gap</p>
              <p className="mt-1 font-medium">{workbench.evidenceSummary.evidenceGap}</p>
            </div>
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">建议页面</p>
              <p className="mt-1 font-medium">{workbench.evidenceSummary.suggestedPage}</p>
            </div>
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">后续复测入口</p>
              <p className="mt-1">{workbench.retestPlaceholder}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h2 className="font-medium">这条任务的原因</h2>
          </div>
          <div className="space-y-3 text-sm">
            <p>{safeText(task.sourceReason)}</p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-md bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">目标关键词</p>
                <p className="mt-1 font-medium">{targetKeyword}</p>
              </div>
              <div className="rounded-md bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">触发原因</p>
                <p className="mt-1 font-medium">{getTriggerLabel(taskEvidence.trigger)}</p>
              </div>
            </div>
            {task.recommendedAngle ? (
              <div className="rounded-md bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">建议切入角度</p>
                <p className="mt-1">{safeText(task.recommendedAngle)}</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            <h2 className="font-medium">{brandName} 当前问题</h2>
          </div>
          <div className="space-y-3 text-sm">
            <p>
              {getBrandProblemText({
                mentionStatus: run?.analysis?.mentionStatus ?? taskEvidence.mentionStatus,
                visibilityScore: run?.analysis?.visibilityScore ?? taskEvidence.visibilityScore,
                competitors,
                brandName,
              })}
            </p>
            <div className="grid gap-3">
              <div className="rounded-md bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">品牌当前状态</p>
                <p className="mt-1 font-medium">
                  {mentionStatusLabel(run?.analysis?.mentionStatus ?? taskEvidence.mentionStatus, brandName)}
                </p>
              </div>
              <div className="rounded-md bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">可见度</p>
                <p className="mt-1 font-medium">
                  {formatPercent(run?.analysis?.visibilityScore ?? taskEvidence.visibilityScore)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-medium">AI 当前怎么回答</h2>
          </div>
          <div className="space-y-4 text-sm">
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">原始监测问题</p>
              <p className="mt-1 font-medium">{sourceQuery}</p>
            </div>
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">回答摘要</p>
              <p className="mt-1">{answerSummary}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-md bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">是否进入推荐位</p>
                <p className="mt-1 font-medium">
                  {mentionStatusLabel(run?.analysis?.mentionStatus ?? taskEvidence.mentionStatus, brandName)}
                </p>
              </div>
              <div className="rounded-md bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">排名语境</p>
                <p className="mt-1 font-medium">
                  {rankTypeLabel(run?.analysis?.rankType ?? taskEvidence.rankType)}
                </p>
              </div>
              <div className="rounded-md bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">影响判断</p>
                <p className="mt-1 font-medium">
                  {impactLevelLabel(run?.analysis?.impactLevel)}
                </p>
              </div>
              <div className="rounded-md bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">可见度分</p>
                <p className="mt-1 font-medium">
                  {formatPercent(run?.analysis?.visibilityScore ?? taskEvidence.visibilityScore)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            <h2 className="font-medium">AI 推荐了哪些竞品</h2>
          </div>
          {analysisCompetitorDetails.length > 0 ? (
            <div className="space-y-3">
              {analysisCompetitorDetails.slice(0, 5).map((competitor) => (
                <div key={competitor.name} className="rounded-md bg-muted/40 p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{safeText(competitor.name)}</p>
                    <span className="text-xs text-muted-foreground">
                      {competitor.rank ? `第 ${competitor.rank} 位` : "未识别排名"}
                    </span>
                  </div>
                  <p className="mt-2 text-muted-foreground">
                    {safeText(competitor.evidence, "AI 回答里出现了这个竞品。")}
                  </p>
                  {safeArray<string>(competitor.reasonTags).length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {safeArray<string>(competitor.reasonTags).map((tag) => (
                        <span key={tag} className="rounded bg-background px-2 py-0.5 text-xs">
                          {REASON_TAG_LABELS[tag] || tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : competitors.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {competitors.map((competitor) => (
                <span key={competitor} className="rounded bg-muted px-2 py-1 text-sm">
                  {competitor}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">这条任务里还没有识别出明确竞品。</p>
          )}
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-3 font-medium">建议怎么修</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {workbench.howToFix.map((item) => (
            <div key={item} className="rounded-md bg-muted/40 p-3 text-sm">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h2 className="font-medium">{guide.title}</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {guide.blocks.map((block) => (
            <div key={block.label} className="rounded-md bg-muted/40 p-4">
              <p className="text-sm font-medium">{block.label}</p>
              <div className="mt-2 flex flex-col gap-2 text-sm text-muted-foreground">
                {block.items.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border bg-card p-5">
          <h2 className="mb-3 font-medium">建议补充的证据</h2>
          {evidenceSpans.length > 0 ? (
            <div className="space-y-3">
              {evidenceSpans.map((span, index) => (
                <div key={`${span.entity || "span"}-${index}`} className="rounded-md bg-muted/40 p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-background px-2 py-0.5 text-xs">
                      {safeText(span.entity, "证据片段")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {EVIDENCE_TYPE_LABELS[safeText(span.type, "unknown")] ||
                        safeText(span.type, "证据片段")}
                    </span>
                  </div>
                  <p className="mt-2 text-muted-foreground">{safeText(span.text)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              目前没有可直接展示的证据片段，建议优先补充真实案例、报价方式、施工过程和售后说明。
            </p>
          )}
        </div>

        <div className="rounded-lg border bg-card p-5">
          <h2 className="mb-3 font-medium">完成后预期提升</h2>
          <div className="space-y-3 text-sm">
            {expectedOutcomes.map((item) => (
              <div key={item} className="rounded-md bg-muted/40 p-3">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-3 font-medium">生成草稿入口</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          先生成编辑简报，再生成内容草稿。当前状态会跟随现有内容流程自动更新，不在这轮额外增加新的状态流。
        </p>
        <TaskActions taskId={task.id} currentStatus={task.status} showStatusActions={false} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border bg-card p-5">
          <h2 className="mb-3 font-medium">编辑简报</h2>
          {brief ? (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">这篇内容写给谁</p>
                <p className="mt-1">{safeText(brief.audience)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">内容角度</p>
                <p className="mt-1">{safeText(brief.angle)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">必须准备的素材</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {safeArray<string>(brief.evidenceNeeded).length > 0 ? (
                    safeArray<string>(brief.evidenceNeeded).map((item) => (
                      <span key={item} className="rounded bg-muted px-2 py-0.5 text-xs">
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground">暂未生成</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">建议结构</p>
                <div className="mt-2 flex flex-col gap-2">
                  {safeArray<string>(brief.outline).length > 0 ? (
                    safeArray<string>(brief.outline).map((item) => (
                      <div key={item} className="rounded bg-muted/40 px-3 py-2 text-sm">
                        {item}
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">暂未生成</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              还没有生成编辑简报。点击上方按钮后，这里会出现更具体的写作说明。
            </p>
          )}
        </div>

        <div className="rounded-lg border bg-card p-5">
          <h2 className="mb-3 font-medium">内容草稿</h2>
          {task.draftMarkdown ? (
            <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap rounded bg-muted/30 p-4 text-xs leading-relaxed">
              {task.draftMarkdown}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">
              还没有生成草稿。先生成编辑简报，再生成内容草稿，会更贴近这条任务的 GEO 目标。
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
