"use client"

import { useState, type ReactNode } from "react"
import { X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

export type EvidenceDetailDrawerData = {
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
                  该判断基于当前可用答案与来源信息，不代表平台官方归因。
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
                  当前仅为修复任务草稿，不会写入数据库，也不会创建真实任务。
                </p>
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
                  系统推断，不代表平台官方归因。
                </p>
              </Section>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  )
}
