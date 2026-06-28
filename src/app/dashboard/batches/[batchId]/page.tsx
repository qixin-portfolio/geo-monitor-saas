import Link from "next/link"
import { notFound } from "next/navigation"

import { CopyTextButton } from "@/components/copy-text-button"
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
import { getBatchReportPageData } from "@/lib/monitoring/read-models"
import {
  formatBatchStatus,
  formatRank,
  formatRunStatus,
  generateBatchSuggestions,
  getBrandRank,
  getMentionStatus,
  getVisibilityScore,
  isBrandRecommended,
  providerDisplayName,
  summarizeRuns,
  toCompetitorViews,
} from "@/lib/monitoring/report-view"

export const dynamic = "force-dynamic"

function formatDate(value: Date | null | undefined) {
  return value ? value.toLocaleString("zh-CN", { hour12: false }) : "-"
}

function formatDuration(startedAt: Date | null, finishedAt: Date | null) {
  if (!startedAt || !finishedAt) return "-"
  const seconds = Math.max(0, Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000))
  if (seconds < 60) return `${seconds} 秒`
  return `${Math.floor(seconds / 60)} 分 ${seconds % 60} 秒`
}

export default async function BatchReportPage({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const { batchId } = await params
  const data = await getBatchReportPageData(batchId)
  if (!data) notFound()

  const { tenant, batch } = data
  const summary = summarizeRuns({
    runs: batch.queryRuns,
    brandName: tenant.brandName,
  })
  const suggestions = generateBatchSuggestions({
    runs: batch.queryRuns,
    brandName: tenant.brandName,
  })
  const provider = batch.queryRuns[0]?.provider ?? "-"
  const model = batch.queryRuns[0]?.model ?? "-"
  const successRate =
    batch.queryCount > 0 ? Math.round((batch.successCount / batch.queryCount) * 100) : 0

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold">本轮监测报告</h1>
            <Badge variant="outline">{formatBatchStatus(batch.status)}</Badge>
          </div>
          <p className="mt-2 text-muted-foreground">
            {providerDisplayName(provider)} / {model} · 品牌：
            {tenant.brandName ?? "未设置品牌"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard">返回 Dashboard</Link>
          </Button>
          <CopyTextButton text={batch.id} label="复制批次 ID" />
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>报告摘要</CardTitle>
          <CardDescription>
            批次 ID：<code className="rounded bg-muted px-1.5 py-0.5">{batch.id}</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-3">
          <p>触发方式：{batch.triggerType}</p>
          <p>Provider：{providerDisplayName(provider)}</p>
          <p>Model：{model}</p>
          <p>问题数：{batch.queryCount}</p>
          <p>成功：{batch.successCount}</p>
          <p>失败：{batch.failureCount}</p>
          <p>开始：{formatDate(batch.startedAt)}</p>
          <p>结束：{formatDate(batch.finishedAt)}</p>
          <p>耗时：{formatDuration(batch.startedAt, batch.finishedAt)}</p>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-5">
        <DashboardStatCard label="成功率" value={`${successRate}%`} />
        <DashboardStatCard label="提及率" value={`${summary.mentionRate}%`} />
        <DashboardStatCard label="推荐率" value={`${summary.recommendationRate}%`} />
        <DashboardStatCard
          label="平均排名"
          value={summary.averageRank ?? "暂无排名"}
        />
        <DashboardStatCard label="竞品数量" value={summary.competitors.length} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>本轮结论</CardTitle>
          <CardDescription>根据本批次 QueryRunAnalysis 规则生成。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="rounded-lg border bg-muted/30 p-4 text-base">
            {summary.conclusion}
          </p>
          <div className="grid gap-2 md:grid-cols-3">
            {summary.findings.map((finding) => (
              <div key={finding} className="rounded-lg border p-3">
                {finding}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>问题结果表</CardTitle>
          <CardDescription>逐条查看本轮 AI 监测问题、提及状态和分析结果。</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>问题</TableHead>
                <TableHead>Provider / Model</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>是否提及</TableHead>
                <TableHead>是否推荐</TableHead>
                <TableHead>排名</TableHead>
                <TableHead>可见度</TableHead>
                <TableHead>竞品</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batch.queryRuns.map((run) => {
                const competitors = toCompetitorViews({
                  competitorsJson: run.analysis?.competitorsJson,
                  fallbackCompetitors: run.competitors,
                })

                return (
                  <TableRow key={run.id}>
                    <TableCell className="max-w-[280px] whitespace-normal font-medium">
                      {run.query.text}
                    </TableCell>
                    <TableCell className="max-w-[220px] whitespace-normal">
                      {providerDisplayName(run.provider)} / {run.model}
                    </TableCell>
                    <TableCell>{formatRunStatus(run.status)}</TableCell>
                    <TableCell>
                      {getMentionStatus(run) === "NONE" ? "未自然提及" : "已提及"}
                    </TableCell>
                    <TableCell>
                      {isBrandRecommended(run) ? "已推荐" : "未明确推荐"}
                    </TableCell>
                    <TableCell>{formatRank(getBrandRank(run))}</TableCell>
                    <TableCell>{getVisibilityScore(run) ?? "-"}</TableCell>
                    <TableCell>{competitors.length} 个</TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/runs/${run.id}`}>查看详情</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI 没有提及品牌的问题</CardTitle>
          <CardDescription>
            这些问题下，AI 回答没有自然出现 {tenant.brandName ?? "当前品牌"}。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {summary.unmentionedRuns.length === 0 ? (
            <p className="text-sm text-muted-foreground">本轮没有未提及问题。</p>
          ) : (
            summary.unmentionedRuns.map((run) => (
              <div key={run.id} className="rounded-lg border p-3 text-sm">
                <p className="font-medium">{run.query?.text}</p>
                <p className="mt-2 line-clamp-3 whitespace-pre-line text-muted-foreground">
                  {run.analysis?.summary ?? run.rawOutput ?? "暂无回答摘要"}
                </p>
                <Button asChild className="mt-3" size="sm" variant="outline">
                  <Link href={`/dashboard/runs/${run.id}`}>查看详情</Link>
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>竞品汇总</CardTitle>
          <CardDescription>
            已过滤“整体装修、本地装修、装修公司、免费设计、施工队、设计师”等泛词。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {summary.competitors.length === 0 ? (
            <p className="text-sm text-muted-foreground">本轮没有识别到明确竞品。</p>
          ) : (
            summary.competitors.map((competitor) => (
              <div key={competitor.name} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{competitor.name}</p>
                  <span className="text-muted-foreground">出现 {competitor.count} 次</span>
                </div>
                <p className="mt-1 text-muted-foreground">
                  最高排名：{formatRank(competitor.bestRank)}
                </p>
                <div className="mt-2 space-y-1 text-muted-foreground">
                  {competitor.questions.slice(0, 3).map((question) => (
                    <p key={`${competitor.name}-${question.id}`}>出现问题：{question.text}</p>
                  ))}
                </div>
                <Button asChild className="mt-3" size="sm" variant="outline">
                  <Link href={`/dashboard/runs/${competitor.runIds[0]}`}>
                    查看相关回答
                  </Link>
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>本轮建议</CardTitle>
          <CardDescription>第一版基于规则生成，不额外调用 AI。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
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
  )
}
