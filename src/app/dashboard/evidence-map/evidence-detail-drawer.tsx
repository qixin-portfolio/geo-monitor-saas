"use client"

import { useState, type ReactNode } from "react"
import { ClipboardList, Loader2, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  createEvidenceRepairTask,
  type CreateEvidenceRepairTaskInput,
  type CreateEvidenceRepairTaskResult,
} from "@/app/dashboard/content-backlog/actions/create-evidence-repair-task"
import type { AnswerSourceDraft } from "@/lib/evidence/extract-answer-sources"
import type { EvidenceConfidenceLabel } from "@/lib/evidence/classify-evidence-confidence"
import type {
  BrandMentionChange,
  EvidenceChange,
  EvidenceRunComparison,
} from "@/lib/evidence/compare-evidence-runs"
import type {
  EvidenceGap,
  EvidencePriority,
  EvidenceSourceType,
} from "@/lib/evidence/extract-evidence-map"
import type { RepairTaskDraft } from "@/lib/evidence/map-evidence-gap-to-repair-task"
import type { ContentBacklogTaskDraft } from "@/lib/evidence/map-repair-task-to-content-task"

export type EvidenceDetailDrawerData = {
  queryId: string
  queryRunId: string
  analysisId: string | null
  query: string
  intentLabel: string
  platform: string
  surface: string
  provider: string
  model: string
  runTime: string
  brandMentioned: boolean
  competitorsMentioned: string[]
  sourceTypes: EvidenceSourceType[]
  answerSources: AnswerSourceDraft[]
  evidenceGap: EvidenceGap
  priority: EvidencePriority
  reason: string
  suggestedPage: string
  suggestedAction: string
  repairTask: RepairTaskDraft
  contentTaskDraft: ContentBacklogTaskDraft
  comparison: EvidenceRunComparison
  previousRunTime: string | null
  confidenceLabel: EvidenceConfidenceLabel
}

type EvidenceDetailDrawerProps = {
  detail: EvidenceDetailDrawerData
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

const confidenceLevelLabels: Record<EvidenceConfidenceLabel["confidenceLevel"], string> = {
  high: "高置信命中",
  medium: "中置信推断",
  low: "低置信 / 数据不足",
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

type CreateTaskStatus =
  | "idle"
  | "loading"
  | "success"
  | "duplicate"
  | "validation_error"
  | "permission_error"
  | "unknown_error"

const createTaskMessages: Record<Exclude<CreateTaskStatus, "idle" | "loading">, string> = {
  success: "已加入修复任务池。",
  duplicate: "该修复任务已存在，未重复创建。",
  validation_error: "当前任务信息不足，暂时无法加入修复任务池。",
  permission_error: "当前账号无权创建该任务。",
  unknown_error: "暂时无法创建任务，请稍后重试。",
}

function priorityClass(priority: EvidencePriority) {
  if (priority === "P0") return "border-red-200 bg-red-50 text-red-700"
  if (priority === "P1") return "border-amber-200 bg-amber-50 text-amber-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

function confidenceClass(level: EvidenceConfidenceLabel["confidenceLevel"]) {
  if (level === "high") return "border-green-200 bg-green-50 text-green-700"
  if (level === "medium") return "border-amber-200 bg-amber-50 text-amber-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

function createStatusClass(status: CreateTaskStatus) {
  if (status === "success") return "text-green-700"
  if (status === "duplicate") return "text-amber-700"
  if (status === "validation_error" || status === "permission_error" || status === "unknown_error") {
    return "text-destructive"
  }
  return "text-muted-foreground"
}

function getCreateStatus(result: CreateEvidenceRepairTaskResult): CreateTaskStatus {
  if (result.success && result.duplicate) return "duplicate"
  if (result.success) return "success"

  const errorText = result.errors.join(" ")
  if (/未登录|租户|无权|不属于当前|不存在|query|queryRun|analysis/i.test(errorText)) {
    return "permission_error"
  }
  if (/draft|白名单|invalid priority|priority|taskType|evidenceGap|raw response|secret/i.test(errorText)) {
    return "validation_error"
  }
  return "unknown_error"
}

function buildCreateRepairTaskInput(
  detail: EvidenceDetailDrawerData
): CreateEvidenceRepairTaskInput {
  const task = detail.repairTask
  const contentTaskDraft = detail.contentTaskDraft
  const nextSteps = task.nextSteps

  return {
    queryId: detail.queryId,
    queryRunId: detail.queryRunId,
    analysisId: detail.analysisId,
    draft: {
      title: contentTaskDraft.title,
      type: contentTaskDraft.type,
      priority: contentTaskDraft.priority,
      sourceQuery: contentTaskDraft.sourceQuery,
      sourceReason: contentTaskDraft.sourceReason,
      targetKeyword: contentTaskDraft.targetKeyword,
      targetAudience: contentTaskDraft.targetAudience,
      recommendedAngle: contentTaskDraft.recommendedAngle,
      evidenceJson: {
        source: "evidence_map",
        trigger: task.evidenceGap,
        relatedQuery: task.relatedQuery,
        suggestedPage: task.suggestedPage,
        nextSteps,
        repairTask: {
          taskType: task.taskType,
          priority: task.priority,
          evidenceGap: task.evidenceGap,
          suggestedPage: task.suggestedPage,
          expectedImpact: task.expectedImpact,
          effortLevel: task.effortLevel,
          nextSteps,
        },
      },
      briefJson: {
        audience: contentTaskDraft.targetAudience,
        searchIntent: task.relatedQuery,
        angle: task.title,
        differentiationTargets: [task.suggestedPage, task.evidenceGap, task.taskType],
        forbiddenClaims: [
          "不要伪造案例、评价、资质或第三方背书。",
          "不要承诺页面修改后 AI 答案会立即改变。",
        ],
        evidenceNeeded: [task.description, task.suggestedPage, task.expectedImpact],
        outline: nextSteps,
        internalLinks: [task.suggestedPage],
        llmsNotes: [
          "由 Evidence Map 的 RepairTask draft 映射而来。",
          "用户确认后加入单条修复任务池。",
        ],
      },
    },
  }
}

function Section({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="space-y-3 border-t pt-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  )
}

function Field({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  )
}

export function EvidenceDetailDrawer({ detail }: EvidenceDetailDrawerProps) {
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [createStatus, setCreateStatus] = useState<CreateTaskStatus>("idle")
  const hasRepairTaskDraft = Boolean(detail.repairTask.title && detail.contentTaskDraft.title)
  const isCreating = createStatus === "loading"
  const createdOrDuplicate = createStatus === "success" || createStatus === "duplicate"
  const createMessage =
    createStatus === "idle" || createStatus === "loading" ? "" : createTaskMessages[createStatus]
  const createButtonLabel =
    createStatus === "success"
      ? "已加入"
      : createStatus === "duplicate"
        ? "已存在"
        : isCreating
          ? "加入中..."
          : "加入修复任务池"

  async function handleConfirmCreate() {
    if (!hasRepairTaskDraft) {
      setCreateStatus("validation_error")
      setConfirmOpen(false)
      return
    }

    setCreateStatus("loading")

    try {
      const result = await createEvidenceRepairTask(buildCreateRepairTaskInput(detail))
      setCreateStatus(getCreateStatus(result))
    } catch {
      setCreateStatus("unknown_error")
    } finally {
      setConfirmOpen(false)
    }
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        查看详情
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/30" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default"
            aria-label="关闭证据详情"
            onClick={() => setOpen(false)}
          />
          <aside className="relative ml-auto flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-background p-6 shadow-xl">
            <header className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <Badge variant="outline">系统推断</Badge>
                <h2 className="text-xl font-semibold">证据详情</h2>
                <p className="text-sm text-muted-foreground">
                  该判断基于当前可用答案与来源信息，不代表第三方平台确认的来源结论。
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="关闭证据详情"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </header>

            <div className="mt-6 space-y-6">
              <Section title="Query 基本信息">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Query" value={detail.query || "-"} />
                  <Field label="场景" value={detail.intentLabel || "-"} />
                  <Field label="当前 run 时间" value={detail.runTime || "-"} />
                  <Field
                    label="平台 / surface"
                    value={`${detail.platform || "-"} / ${detail.surface || "-"}`}
                  />
                  <Field label="Provider" value={detail.provider || "-"} />
                  <Field label="Model" value={detail.model || "-"} />
                </div>
              </Section>

              <Section title="品牌与竞品判断">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="品牌是否提及"
                    value={detail.brandMentioned ? "已提及" : "未提及"}
                  />
                  <Field
                    label="提及依据"
                    value={
                      detail.brandMentioned
                        ? "系统在当前答案文本中匹配到品牌名。"
                        : "当前答案文本未匹配到品牌名。"
                    }
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">竞品提及列表</div>
                  {detail.competitorsMentioned.length ? (
                    <div className="flex flex-wrap gap-2">
                      {detail.competitorsMentioned.map((competitor) => (
                        <Badge key={competitor} variant="outline">
                          {competitor}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">当前答案未命中已知竞品名。</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    竞品命中依据来自当前答案与已知竞品词库的文本匹配。
                  </p>
                </div>
              </Section>

              <Section title="来源判断">
                <div className="flex flex-wrap gap-2">
                  {detail.sourceTypes.map((sourceType) => (
                    <Badge key={sourceType} variant="outline">
                      {sourceTypeLabels[sourceType]}
                    </Badge>
                  ))}
                </div>
                {detail.answerSources.length ? (
                  <div className="space-y-3">
                    {detail.answerSources.map((source, index) => (
                      <div
                        key={`${source.url ?? source.domain ?? "source"}-${index}`}
                        className="rounded-md border px-3 py-2 text-sm"
                      >
                        <div className="font-medium">{source.title ?? source.domain ?? "未命名来源"}</div>
                        <div className="mt-1 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                          <span>Domain：{source.domain ?? "-"}</span>
                          <span>类型：{sourceTypeLabels[source.sourceType]}</span>
                          <span>置信度：{Math.round(source.confidence * 100)}%</span>
                          <span>提取方式：{source.extractionMethod}</span>
                        </div>
                        {source.snippet ? (
                          <p className="mt-2 text-xs text-muted-foreground">{source.snippet}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    当前答案未提供可解析来源，系统仅能基于文本做低置信推断。
                  </p>
                )}
              </Section>

              <Section title="Evidence Gap">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="证据缺口" value={evidenceGapLabels[detail.evidenceGap]} />
                  <Field
                    label="优先级"
                    value={
                      <Badge className={priorityClass(detail.priority)} variant="outline">
                        {detail.priority}
                      </Badge>
                    }
                  />
                  <Field label="建议页面" value={detail.suggestedPage || "-"} />
                  <Field label="建议动作" value={detail.suggestedAction || "-"} />
                </div>
                <p className="text-sm text-muted-foreground">{detail.reason}</p>
              </Section>

              <Section title="RepairTask Draft">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="任务类型" value={repairTaskTypeLabels[detail.repairTask.taskType]} />
                  <Field label="标题" value={detail.repairTask.title} />
                  <Field label="预期影响" value={detail.repairTask.expectedImpact} />
                  <Field label="工作量" value={detail.repairTask.effortLevel} />
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Next steps</div>
                  <ul className="list-inside list-disc space-y-1 text-sm">
                    {detail.repairTask.nextSteps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </div>
                <p className="text-xs text-muted-foreground">
                  该草稿由系统推断生成。用户确认后只会加入单条修复任务池，并可在 GEO 修复任务中继续编辑和确认。
                </p>
                <div className="flex flex-col gap-2 rounded-md border border-dashed px-3 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={isCreating || createdOrDuplicate || !hasRepairTaskDraft}
                      onClick={() => setConfirmOpen(true)}
                    >
                      {isCreating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ClipboardList className="h-4 w-4" />
                      )}
                      {createButtonLabel}
                    </Button>
                    {!hasRepairTaskDraft ? (
                      <span className="text-xs text-muted-foreground">
                        当前缺少可创建的修复任务
                      </span>
                    ) : null}
                  </div>
                  {createMessage ? (
                    <p className={`text-sm ${createStatusClass(createStatus)}`} aria-live="polite">
                      {createMessage}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      确认后将复用已通过 Manual QA 的 server action，并由 server 端重新校验权限、tenant 和任务归属。
                    </p>
                  )}
                </div>
              </Section>

              <Section title="Run Before/After Comparison">
                {detail.previousRunTime ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="上次 run" value={detail.previousRunTime} />
                    <Field label="本次 run" value={detail.runTime} />
                    <Field
                      label="品牌变化"
                      value={brandMentionChangeLabels[detail.comparison.brandMentionChange]}
                    />
                    <Field
                      label="竞品变化"
                      value={evidenceChangeLabels[detail.comparison.competitorChangeSummary]}
                    />
                    <Field
                      label="来源变化"
                      value={evidenceChangeLabels[detail.comparison.sourceTypeChangeSummary]}
                    />
                    <Field
                      label="缺口变化"
                      value={evidenceChangeLabels[detail.comparison.gapChange]}
                    />
                    <Field
                      label="总体判断"
                      value={evidenceChangeLabels[detail.comparison.overallChange]}
                    />
                    <Field
                      label="对比置信度"
                      value={`${Math.round(detail.comparison.confidence * 100)}%`}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    暂无历史对比，完成下一次 Monitoring 后可判断变化趋势。
                  </p>
                )}
                <p className="text-sm text-muted-foreground">{detail.comparison.reason}</p>
              </Section>

              <Section title="Confidence Label">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    className={confidenceClass(detail.confidenceLabel.confidenceLevel)}
                    variant="outline"
                  >
                    {confidenceLevelLabels[detail.confidenceLabel.confidenceLevel]}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {detail.confidenceLabel.confidenceScore}%
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">Reasons</div>
                    <ul className="list-inside list-disc space-y-1 text-sm">
                      {detail.confidenceLabel.reasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">Warnings</div>
                    {detail.confidenceLabel.warnings.length ? (
                      <ul className="list-inside list-disc space-y-1 text-sm text-amber-700">
                        {detail.confidenceLabel.warnings.map((warning) => (
                          <li key={warning}>{warning}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">当前没有额外数据不足提示。</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  系统推断，不代表第三方平台确认的来源结论。
                </p>
              </Section>
            </div>
          </aside>
          {confirmOpen ? (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
              <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="repair-task-confirm-title"
                aria-describedby="repair-task-confirm-description"
                className="w-full max-w-md rounded-md border bg-background p-5 shadow-xl"
              >
                <div className="space-y-2">
                  <h3 id="repair-task-confirm-title" className="text-base font-semibold">
                    加入修复任务池
                  </h3>
                  <p id="repair-task-confirm-description" className="text-sm text-muted-foreground">
                    该任务由系统根据当前 AI 答案、来源信息和证据缺口推断生成，并非第三方平台确认的来源结论。加入后你可以在 GEO 修复任务中继续编辑和确认。
                  </p>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isCreating}
                    onClick={() => setConfirmOpen(false)}
                  >
                    取消
                  </Button>
                  <Button type="button" disabled={isCreating} onClick={handleConfirmCreate}>
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    确认加入
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  )
}
