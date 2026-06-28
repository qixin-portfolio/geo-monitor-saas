import Link from "next/link"

import { AnomalyBanner } from "@/components/anomaly-banner"
import { CopyTextButton } from "@/components/copy-text-button"
import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PlanBadge } from "@/components/plan-badge"
import { RunNowButton } from "@/components/run-now-button"
import { TrendChart } from "@/components/trend-chart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Download } from "lucide-react"
import { getPlanLimit } from "@/lib/plans"
import { getMonitoringDashboardData } from "@/lib/monitoring/read-models"
import {
  formatBatchStatus,
  providerDisplayName,
  summarizeRuns,
} from "@/lib/monitoring/report-view"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  let data: Awaited<ReturnType<typeof getMonitoringDashboardData>> | null = null
  let errorMsg: string | null = null

  try {
    data = await getMonitoringDashboardData()
  } catch (err) {
    console.error("[Dashboard] getMonitoringDashboardData failed:", err)
    errorMsg = err instanceof Error ? err.message : String(err)
  }

  // Even when data fetch fails, show a degraded dashboard instead of crashing
  if (!data) {
    return (
      <div className="flex flex-col gap-6 p-6 md:p-8">
        <header>
          <h1 className="text-3xl font-semibold">GEO Monitor</h1>
          <p className="mt-2 text-muted-foreground">品牌监测看板</p>
        </header>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p className="font-medium">数据加载失败</p>
          <p className="mt-1">{errorMsg ?? "未知错误，请刷新页面重试"}</p>
        </div>
        <section className="grid gap-4 md:grid-cols-4">
          <DashboardStatCard label="关键词数量" value={0} />
          <DashboardStatCard label="最近一轮监测数" value={0} />
          <DashboardStatCard label="品牌被提及" value={0} />
          <DashboardStatCard label="AI 推荐率" value="0%" hint="平均排名待积累" />
        </section>
        <RunNowButton />
      </div>
    )
  }

  const {
    tenant,
    queryCount,
    responseCount,
    mentionedCount,
    recommendationRate,
    averageRank,
    competitors,
    anomalyFlags,
    lastRunStatus,
    lastRunLabel,
    latestBaselineBatch,
    latestReportBatch,
    recentSnapshots,
    recentQueries,
  } = data
  const latestReportRuns = latestReportBatch?.queryRuns ?? []
  const latestSummary = latestReportBatch
    ? summarizeRuns({
        runs: latestReportRuns,
        brandName: tenant.brandName,
      })
    : null
  const latestProvider = latestReportRuns[0]?.provider ?? "-"
  const latestModel = latestReportRuns[0]?.model ?? "-"
  const latestSuccessRate =
    latestReportBatch && latestReportBatch.queryCount > 0
      ? Math.round((latestReportBatch.successCount / latestReportBatch.queryCount) * 100)
      : 0

  return (
    <div className="flex flex-col gap-8 p-6 md:p-8">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold">{tenant.name}</h1>
            <PlanBadge plan={tenant.plan} />
          </div>
          <p className="mt-2 text-muted-foreground">
            品牌：{tenant.brandName ?? "未设置品牌"} · 关键词上限：
            {getPlanLimit(tenant.plan)} · 最近运行：{lastRunLabel} · 状态：{lastRunStatus}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <RunNowButton />
          <Button asChild variant="outline">
            <Link href="/dashboard/queries">管理关键词</Link>
          </Button>
          {latestBaselineBatch ? (
            <Button asChild variant="outline">
              <Link href={`/dashboard/batches/${latestBaselineBatch.id}`}>
                查看最新基线报告
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link href="/api/report/export" download>
              <Download className="mr-2 h-4 w-4" />
              导出报告
            </Link>
          </Button>
        </div>
      </header>

      <AnomalyBanner anomalyFlags={anomalyFlags} />

      {latestReportBatch && latestSummary ? (
        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>最近一轮监测：{providerDisplayName(latestProvider)}</CardTitle>
                  <CardDescription className="mt-2">
                    {latestReportBatch.queryCount} 个问题，
                    {latestReportBatch.successCount} 个成功，
                    {latestReportBatch.failureCount} 个失败。
                    {latestSummary.mentionedRuns.length === 0
                      ? `本轮没有自然提及 ${tenant.brandName ?? "当前品牌"}。`
                      : `本轮提及 ${tenant.brandName ?? "当前品牌"} ${latestSummary.mentionedRuns.length} 次。`}
                  </CardDescription>
                </div>
                <Badge variant="outline">{formatBatchStatus(latestReportBatch.status)}</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-[1fr_auto]">
              <div className="grid gap-3 text-sm md:grid-cols-2">
                <p>
                  <span className="text-muted-foreground">批次 ID：</span>
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    {latestReportBatch.id}
                  </code>
                </p>
                <p>
                  <span className="text-muted-foreground">模型：</span>
                  {latestModel}
                </p>
                <p>
                  <span className="text-muted-foreground">执行时间：</span>
                  {(latestReportBatch.finishedAt ?? latestReportBatch.startedAt ?? latestReportBatch.createdAt).toLocaleString("zh-CN", {
                    hour12: false,
                  })}
                </p>
                <p>
                  <span className="text-muted-foreground">成功率：</span>
                  {latestSuccessRate}%
                </p>
              </div>
              <div className="flex flex-wrap items-start gap-2">
                <CopyTextButton text={latestReportBatch.id} label="复制批次 ID" />
                <Button asChild>
                  <Link href={`/dashboard/batches/${latestReportBatch.id}`}>
                    查看批次详情
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>品牌 AI 可见度总览</CardTitle>
              <CardDescription>
                品牌：{tenant.brandName ?? "未设置品牌"} · 最近运行：
                {(latestReportBatch.finishedAt ?? latestReportBatch.createdAt).toLocaleString("zh-CN", {
                  hour12: false,
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-2">
              <p>推荐率：{latestSummary.recommendationRate}%</p>
              <p>提及率：{latestSummary.mentionRate}%</p>
              <p>平均排名：{latestSummary.averageRank ?? "暂无排名"}</p>
              <p>可见度分：{latestSummary.averageVisibilityScore}</p>
              <p>竞品数量：{latestSummary.competitors.length}</p>
              <p>Provider：{providerDisplayName(latestProvider)}</p>
              {latestSummary.mentionedRuns.length === 0 ? (
                <p className="md:col-span-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
                  当前品牌在本轮监测中未被 AI 自然提及。
                </p>
              ) : null}
            </CardContent>
          </Card>
        </section>
      ) : null}

      {latestSummary ? (
        <Card>
          <CardHeader>
            <CardTitle>关键发现</CardTitle>
            <CardDescription>根据最近一轮监测结果规则生成。</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-2 text-sm md:grid-cols-3">
              {latestSummary.findings.map((finding) => (
                <li key={finding} className="rounded-lg border p-3">
                  {finding}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <DashboardStatCard label="关键词数量" value={queryCount} />
        <DashboardStatCard label="最近一轮监测数" value={responseCount} />
        <DashboardStatCard label="品牌被提及" value={mentionedCount} />
        <DashboardStatCard
          label="AI 推荐率"
          value={`${recommendationRate}%`}
          hint={averageRank ? `平均排名 ${averageRank}` : "平均排名待积累"}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>最近关键词结果</CardTitle>
            <CardDescription>
              优先显示自动监测结果，没有自动结果时回落到手动录入。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {recentQueries.length === 0 ? (
              <p className="text-sm text-muted-foreground">还没有添加关键词。</p>
            ) : (
              recentQueries.map((query) => (
                <div key={query.id} className="rounded-lg border p-3 text-sm">
                  <div className="font-medium">{query.text}</div>
                  <div className="mt-1 text-muted-foreground">
                    最近记录：
                    {query.latestRun
                      ? query.latestRun.mentioned
                        ? `自动监测提到品牌，排名 ${query.latestRun.rank ?? "未识别"}`
                        : "自动监测未提到品牌"
                      : query.latestResponse?.mentioned
                        ? "手动录入提到品牌"
                        : "暂无自动监测结果"}
                  </div>
                  {query.latestRun ? (
                    <Link
                      href={`/dashboard/runs/${query.latestRun.id}`}
                      className="mt-2 inline-flex text-sm text-primary hover:underline"
                    >
                      查看详情
                    </Link>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>已发现竞品</CardTitle>
              <CardDescription>优先从自动监测快照汇总。</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {competitors.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂未记录竞品。</p>
              ) : (
                competitors.map((competitor) => (
                  <span key={competitor} className="rounded-full border px-3 py-1 text-sm">
                    {competitor}
                  </span>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>最近趋势</CardTitle>
              <CardDescription>按最近 5 次快照展示推荐率变化。</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <TrendChart
                snapshots={recentSnapshots.map((s) => ({
                  ...s,
                  createdAt: new Date(s.createdAt),
                }))}
              />
              {/* Data table below chart */}
              {recentSnapshots.length > 0 ? (
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                  {recentSnapshots
                    .slice()
                    .reverse()
                    .map((snapshot) => (
                      <div
                        key={snapshot.id}
                        className="flex items-center justify-between rounded border px-3 py-1.5"
                      >
                        <span>
                          {new Date(snapshot.createdAt).toLocaleString("zh-CN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })}
                        </span>
                        <span className="font-medium text-foreground">
                          {snapshot.mentionRate}%
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">还没有自动监测趋势数据。</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
