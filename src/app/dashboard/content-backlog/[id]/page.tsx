import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, FileText, Lightbulb, Search, Sparkles, Target } from "lucide-react"

import { getPrisma } from "@/lib/prisma"
import { getOrCreateTenant } from "@/lib/tenant"
import {
  REPAIR_TASK_RISK_LABELS,
  REPAIR_TASK_TYPE_LABELS,
  buildRepairTaskDetailViewModel,
  type RepairTaskRiskLevel,
} from "@/lib/content-backlog/repair-task-workbench"

import { TaskActions } from "./task-actions"

export const dynamic = "force-dynamic"

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

export default async function ContentTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const tenant = await getOrCreateTenant()
  if (!tenant) notFound()

  const prisma = getPrisma()
  const task = await prisma.geoContentTask.findFirst({
    where: { id, tenantId: tenant.id },
  })

  if (!task) notFound()

  const runByTask = task.queryRunId
    ? await prisma.queryRun.findFirst({
        where: {
          id: task.queryRunId,
          query: { tenantId: tenant.id },
        },
        include: {
          query: true,
          analysis: true,
        },
      })
    : null
  const runByAnalysis = !runByTask && task.analysisId
    ? (
        await prisma.queryRunAnalysis.findFirst({
          where: {
            id: task.analysisId,
            queryRun: { query: { tenantId: tenant.id } },
          },
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
  const taskEvidenceSpans = getEvidenceSpans(taskEvidence.evidenceSpans)
  const analysisEvidenceSpans = getEvidenceSpans(run?.analysis?.evidenceSpansJson)
  const evidenceSpans = uniqueEvidenceSpans([
    ...taskEvidenceSpans,
    ...analysisEvidenceSpans,
  ]).slice(0, 8)

  const brandName = safeText(tenant.brandName, "当前品牌")
  const targetKeyword = safeText(task.targetKeyword, safeText(task.sourceQuery, "本地服务问题"))
  const sourceQuery = safeText(run?.query.text ?? task.sourceQuery, "暂未记录原始问题")
  const detailView = buildRepairTaskDetailViewModel({
    task,
    queryRun: run,
    analysis: run?.analysis,
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
      </div>

      <section className="rounded-lg border bg-card p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h2 className="font-medium">1. 任务概览</h2>
            </div>
            <h1 className="text-2xl font-semibold">{task.title}</h1>
            <p className="max-w-4xl text-sm text-muted-foreground">
              {detailView.oneLineSummary}
            </p>
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

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-md bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">当前状态</p>
            <p className="mt-1 font-medium">{STATUS_LABELS[task.status] || task.status}</p>
          </div>
          <div className="rounded-md bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">任务类型</p>
            <p className="mt-1 font-medium">{REPAIR_TASK_TYPE_LABELS[detailView.type]}</p>
          </div>
          <div className="rounded-md bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">风险等级</p>
            <p className="mt-1 font-medium">{REPAIR_TASK_RISK_LABELS[detailView.riskLevel]}</p>
          </div>
          <div className="rounded-md bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">创建时间</p>
            <p className="mt-1 font-medium">{formatDate(task.createdAt)}</p>
          </div>
          <div className="rounded-md bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">关联 query</p>
            <p className="mt-1 font-medium">{detailView.queryText}</p>
          </div>
          <div className="rounded-md bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Platform / Provider</p>
            <p className="mt-1 font-medium">{detailView.platformLabel}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            <h2 className="font-medium">2. 证据依据</h2>
          </div>
          <div className="space-y-4 text-sm">
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">为什么建议修</p>
              <p className="mt-1">{detailView.evidenceBasisSummary}</p>
            </div>
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Source reason</p>
              <p className="mt-1">{safeText(task.sourceReason, "暂未记录 sourceReason，使用 evidence gap 和 query fallback。")}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-md bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Evidence gap</p>
                <p className="mt-1 font-medium">{detailView.evidenceSummary.evidenceGap}</p>
              </div>
              <div className="rounded-md bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">建议页面</p>
                <p className="mt-1 font-medium">{detailView.evidenceSummary.suggestedPage}</p>
              </div>
              <div className="rounded-md bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">品牌是否被提及</p>
                <p className="mt-1 font-medium">{detailView.brandMentionSummary}</p>
              </div>
              <div className="rounded-md bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">竞品是否被提及</p>
                <p className="mt-1 font-medium">{detailView.competitorSummary}</p>
              </div>
            </div>
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">AI 回答安全摘要</p>
              <p className="mt-1">{detailView.answerSummary}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            <h2 className="font-medium">关联 run / analysis 摘要</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">原始监测问题</p>
              <p className="mt-1 font-medium">{sourceQuery}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-md bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">推荐状态</p>
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
            {evidenceSpans.length > 0 ? (
              <div className="space-y-2">
                {evidenceSpans.slice(0, 3).map((span, index) => (
                  <div key={`${span.entity || "span"}-${index}`} className="rounded-md bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">
                      {EVIDENCE_TYPE_LABELS[safeText(span.type, "unknown")] ||
                        safeText(span.type, "证据片段")}
                    </p>
                    <p className="mt-1">{safeText(span.text)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-md bg-muted/40 p-3 text-muted-foreground">
                暂无可展示 evidence span，使用 sourceReason 和回答摘要作为安全 fallback。
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h2 className="font-medium">3. 建议动作</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-3 text-sm">
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">建议修复方向</p>
              <p className="mt-1">{detailView.recommendedAction.angle}</p>
            </div>
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">建议产出物类型</p>
              <p className="mt-1 font-medium">{detailView.recommendedAction.outputType}</p>
            </div>
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">执行提示</p>
              <p className="mt-1">{detailView.recommendedAction.executionHint}</p>
            </div>
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">建议怎么修</p>
              <div className="mt-2 flex flex-col gap-2">
                {detailView.howToFix.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">验收标准占位</p>
              <div className="mt-2 flex flex-col gap-2">
                {detailView.recommendedAction.acceptanceCriteria.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </div>
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">已有内容流程入口</p>
              <p className="mt-1 text-muted-foreground">
                下方按钮是本页既有简报 / 草稿流程，本轮没有新增写库入口，也不会自动触发。
              </p>
              <div className="mt-3">
                <TaskActions taskId={task.id} currentStatus={task.status} showStatusActions={false} />
              </div>
            </div>
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">已有编辑简报 / 草稿</p>
              <p className="mt-1">
                {brief ? "已有编辑简报，可供人工复核。" : "暂未生成编辑简报。"}
                {" "}
                {task.draftMarkdown ? "已有内容草稿。" : "暂未生成内容草稿。"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          <h2 className="font-medium">4. 风险审核建议</h2>
        </div>
        <div className="grid gap-3 lg:grid-cols-[0.8fr_1.2fr]">
          <div className={`rounded-md border p-4 ${RISK_CLASS_NAMES[detailView.riskReview.level]}`}>
            <p className="text-xs">风险等级</p>
            <p className="mt-1 font-medium">
              {detailView.riskReview.level} / {REPAIR_TASK_RISK_LABELS[detailView.riskReview.level]}
            </p>
            <p className="mt-3 text-sm">{detailView.riskReview.summary}</p>
          </div>
          <div className="rounded-md bg-muted/40 p-4 text-sm">
            <p className="text-xs text-muted-foreground">执行建议</p>
            <p className="mt-1">{detailView.riskReview.executionDecision}</p>
          </div>
          <div className="rounded-md bg-muted/40 p-4 text-sm">
            <p className="text-xs text-muted-foreground">风险原因</p>
            <p className="mt-1">{detailView.riskReview.reason}</p>
          </div>
          <div className="rounded-md bg-muted/40 p-4 text-sm">
            <p className="text-xs text-muted-foreground">需要补充的证据</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {detailView.riskReview.requiredEvidence.map((item) => (
                <span key={item} className="rounded bg-background px-2 py-1 text-xs">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-md bg-muted/40 p-4 text-sm">
            <p className="text-xs text-muted-foreground">禁止事项</p>
            <div className="mt-2 flex flex-col gap-2">
              {detailView.riskReview.prohibitedActions.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </div>
          <div className="rounded-md border border-dashed p-4 text-sm lg:col-span-2">
            <p className="text-xs text-muted-foreground">Human Gate 提醒</p>
            <p className="mt-1">{detailView.riskReview.humanGateNotice}</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="font-medium">5. 复测与报告占位</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-3 text-sm">
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">修复前状态</p>
              <p className="mt-1">{detailView.retestPlan.beforeState}</p>
            </div>
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">待复测状态</p>
              <p className="mt-1">{detailView.retestPlan.pendingState}</p>
            </div>
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">报告摘要占位</p>
              <p className="mt-1">{detailView.retestPlan.reportSummary}</p>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">未来复测指标</p>
              <div className="mt-2 flex flex-col gap-2">
                {detailView.retestPlan.metrics.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </div>
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">完成后预期提升</p>
              <div className="mt-2 flex flex-col gap-2">
                {expectedOutcomes.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
