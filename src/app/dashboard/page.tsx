import Link from "next/link"

import { DashboardStatCard } from "@/components/dashboard-stat-card"
import { PlanBadge } from "@/components/plan-badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getPlanLimit } from "@/lib/plans"
import { getTenantWithStats } from "@/lib/tenant"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const {
    tenant,
    queryCount,
    responseCount,
    mentionedCount,
    recentQueries,
    competitors,
    recommendationRate,
  } = await getTenantWithStats()

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
            {getPlanLimit(tenant.plan)}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/queries">开始手动监测</Link>
        </Button>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <DashboardStatCard label="关键词数量" value={queryCount} />
        <DashboardStatCard label="已录入回答" value={responseCount} />
        <DashboardStatCard label="品牌被提及" value={mentionedCount} />
        <DashboardStatCard label="AI 推荐率" value={`${recommendationRate}%`} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>最近关键词</CardTitle>
            <CardDescription>
              V1 先手动录入 AI 回答，系统负责统计和展示。
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
                    {query.responses[0]?.mentioned ? "提到品牌" : "未提到品牌"}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>已发现竞品</CardTitle>
            <CardDescription>从手动录入的 AI 回答中汇总。</CardDescription>
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
      </section>
    </div>
  )
}
