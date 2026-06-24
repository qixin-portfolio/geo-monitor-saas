import Link from "next/link"

import { AnomalyBanner } from "@/components/anomaly-banner"
import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PlanBadge } from "@/components/plan-badge"
import { RunNowButton } from "@/components/run-now-button"
import { TrendChart } from "@/components/trend-chart"
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

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
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
    recentSnapshots,
    recentQueries,
  } = await getMonitoringDashboardData()

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
          <Button asChild variant="outline">
            <Link href="/api/report/export" download>
              <Download className="mr-2 h-4 w-4" />
              导出报告
            </Link>
          </Button>
        </div>
      </header>

      <AnomalyBanner anomalyFlags={anomalyFlags} />

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
