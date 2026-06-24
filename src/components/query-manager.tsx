"use client"

import { useMemo, useState } from "react"
import type { Plan } from "@prisma/client"
import {
  CheckSquare,
  Plus,
  Search,
  Square,
  Trash2,
  Zap,
} from "lucide-react"

import { Paywall } from "@/components/paywall"
import { PlanBadge } from "@/components/plan-badge"
import { QueryRunStatusBadge } from "@/components/query-run-status-badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getPlanLimit } from "@/lib/plans"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ManualResponse = {
  id: string
  platform: string
  answer: string
  mentioned: boolean
  rank: number | null
  competitors: string | null
  notes: string | null
  createdAt: string | Date
}

type AutomatedRun = {
  id: string
  status: string
  mentioned: boolean
  rank: number | null
  competitors: string[]
  errorMessage: string | null
  createdAt: string | Date
}

type QueryItem = {
  id: string
  text: string
  platform: string
  active: boolean
  responses: ManualResponse[]
  queryRuns: AutomatedRun[]
  latestRun: AutomatedRun | null
}

/* ------------------------------------------------------------------ */
/*  Empty state — onboarding for new users                             */
/* ------------------------------------------------------------------ */

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Zap className="h-7 w-7 text-primary" />
        </div>
        <CardTitle className="text-xl">开始你的 GEO 监测</CardTitle>
        <CardDescription className="max-w-md">
          只需三步，即可监控 AI 对你品牌的推荐情况
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="mx-auto max-w-sm space-y-4 text-sm">
          {[
            {
              step: 1,
              title: "填写品牌信息",
              desc: "在上方「品牌设置」中填入你的品牌名、行业和地区",
            },
            {
              step: 2,
              title: "添加监测关键词",
              desc: "输入客户可能会问 AI 的问题，如「交城装修公司哪家靠谱？」",
            },
            {
              step: 3,
              title: "系统自动跑监测",
              desc: "系统会定期用 AI 搜索你的关键词，告诉你品牌是否被推荐",
            },
          ].map((item) => (
            <li key={item.step} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {item.step}
              </span>
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function QueryManager({
  tenant,
  initialQueries,
}: {
  tenant: {
    id: string
    brandName: string | null
    industry: string | null
    region: string | null
    plan: Plan
  }
  initialQueries: QueryItem[]
}) {
  const [queries, setQueries] = useState(initialQueries)
  const [brandName, setBrandName] = useState(tenant.brandName ?? "")
  const [industry, setIndustry] = useState(tenant.industry ?? "")
  const [region, setRegion] = useState(tenant.region ?? "")
  const [queryText, setQueryText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Batch selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const limit = getPlanLimit(tenant.plan)
  const reachedLimit = queries.length >= limit

  /* ---- derived data ---- */

  const activeQueries = queries.filter((q) => q.active)
  const allActiveSelected =
    activeQueries.length > 0 && activeQueries.every((q) => selectedIds.has(q.id))

  const automatedRuns = queries.flatMap((query) => query.queryRuns)
  const manualResponses = queries.flatMap((query) => query.responses)
  const monitoringCount = automatedRuns.length || manualResponses.length
  const mentionedCount = automatedRuns.length
    ? automatedRuns.filter((run) => run.mentioned).length
    : manualResponses.filter((response) => response.mentioned).length
  const recommendationRate = monitoringCount
    ? Math.round((mentionedCount / monitoringCount) * 100)
    : 0

  const competitors = useMemo(() => {
    return Array.from(
      new Set([
        ...queries.flatMap((query) =>
          query.queryRuns.flatMap((run) => run.competitors)
        ),
        ...queries.flatMap((query) =>
          query.responses.flatMap((response) =>
            response.competitors
              ? response.competitors.split(",").map((item) => item.trim())
              : []
          )
        ),
      ])
    ).filter(Boolean)
  }, [queries])

  /* ---- API helpers ---- */

  async function saveTenant() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/tenant/init", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName, industry, region }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error ?? "保存品牌信息失败")
    } finally {
      setSaving(false)
    }
  }

  async function createQuery() {
    if (!queryText.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: queryText }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message ?? data.error ?? "创建关键词失败")
        return
      }
      setQueries((current) => [
        {
          ...data.query,
          active: true,
          responses: [],
          queryRuns: [],
          latestRun: null,
        },
        ...current,
      ])
      setQueryText("")
    } finally {
      setSaving(false)
    }
  }

  async function toggleQuery(queryId: string, active: boolean) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/queries/${queryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "切换关键词状态失败")
        return
      }
      setQueries((current) =>
        current.map((q) =>
          q.id === queryId ? { ...q, active: data.query.active } : q
        )
      )
    } finally {
      setSaving(false)
    }
  }

  async function deleteQuery(queryId: string) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/queries/${queryId}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "删除关键词失败")
        return
      }
      setQueries((current) => current.filter((q) => q.id !== queryId))
      setSelectedIds((current) => {
        const next = new Set(current)
        next.delete(queryId)
        return next
      })
    } finally {
      setSaving(false)
    }
  }

  async function batchDelete() {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    if (!window.confirm(`确定删除选中的 ${ids.length} 个关键词？此操作不可撤销。`)) return
    setSaving(true)
    setError(null)
    try {
      await Promise.all(
        ids.map((id) => fetch(`/api/queries/${id}`, { method: "DELETE" }))
      )
      setQueries((current) => current.filter((q) => !selectedIds.has(q.id)))
      setSelectedIds(new Set())
    } finally {
      setSaving(false)
    }
  }

  async function batchSetActive(active: boolean) {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    setSaving(true)
    setError(null)
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/queries/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ active }),
          })
        )
      )
      setQueries((current) =>
        current.map((q) =>
          selectedIds.has(q.id) ? { ...q, active } : q
        )
      )
      setSelectedIds(new Set())
    } finally {
      setSaving(false)
    }
  }

  function toggleSelectAll() {
    if (allActiveSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(activeQueries.map((q) => q.id)))
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function createResponse(formData: FormData) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queryId: formData.get("queryId"),
          platform: formData.get("platform"),
          answer: formData.get("answer"),
          mentioned: formData.get("mentioned") === "on",
          rank: formData.get("rank"),
          competitors: formData.get("competitors"),
          notes: formData.get("notes"),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "录入回答失败")
        return
      }
      setQueries((current) =>
        current.map((q) =>
          q.id === data.response.queryId
            ? { ...q, responses: [data.response, ...q.responses] }
            : q
        )
      )
    } finally {
      setSaving(false)
    }
  }

  /* ---- render ---- */

  return (
    <div className="flex flex-col gap-6">
      {/* Stats row */}
      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              当前套餐
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PlanBadge plan={tenant.plan} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              关键词
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {queries.length}/{limit}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              监测记录
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {monitoringCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              AI 推荐率
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {recommendationRate}%
          </CardContent>
        </Card>
      </section>

      {/* Brand settings */}
      <Card>
        <CardHeader>
          <CardTitle>品牌设置</CardTitle>
          <CardDescription>
            先填品牌、行业和地区，后续自动监测和手动补录都会围绕这个企业空间。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <div className="flex flex-col gap-2">
            <Label htmlFor="brandName">品牌名</Label>
            <Input
              id="brandName"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="例如：晟景装饰"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="industry">行业</Label>
            <Input
              id="industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="例如：装修"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="region">地区</Label>
            <Input
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="例如：交城"
            />
          </div>
          <Button className="self-end" disabled={saving} onClick={saveTenant}>
            保存
          </Button>
        </CardContent>
      </Card>

      {/* Add keyword */}
      <Card>
        <CardHeader>
          <CardTitle>添加监测关键词</CardTitle>
          <CardDescription>
            示例：交城装修公司哪家靠谱？本地装修公司推荐？
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row">
          <Input
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="输入你要去问 AI 的问题"
            onKeyDown={(e) => {
              if (e.key === "Enter") createQuery()
            }}
          />
          <Button disabled={saving || reachedLimit} onClick={createQuery}>
            <Plus className="mr-1 h-4 w-4" />
            添加关键词
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}
      {reachedLimit ? <Paywall /> : null}

      {/* Batch operations toolbar */}
      {queries.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 px-4 py-2 text-sm">
          <button
            className="flex items-center gap-1.5 hover:text-primary"
            onClick={toggleSelectAll}
          >
            {allActiveSelected ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            全选活跃关键词
          </button>
          {selectedIds.size > 0 && (
            <>
              <span className="text-muted-foreground">
                已选 {selectedIds.size} 项
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={() => batchSetActive(true)}
              >
                批量启用
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={() => batchSetActive(false)}
              >
                批量暂停
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={saving}
                onClick={batchDelete}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                批量删除
              </Button>
            </>
          )}
        </div>
      )}

      {/* Query list */}
      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="flex flex-col gap-4">
          {queries.length === 0 ? (
            <EmptyState />
          ) : (
            queries.map((query) => (
              <Card key={query.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {query.active && (
                        <button
                          className="shrink-0"
                          onClick={() => toggleSelect(query.id)}
                        >
                          {selectedIds.has(query.id) ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      )}
                      <div>
                        <CardTitle>{query.text}</CardTitle>
                        <CardDescription className="mt-2 flex flex-wrap items-center gap-2">
                          <QueryRunStatusBadge
                            status={query.latestRun?.status ?? "NEVER_RUN"}
                          />
                          <span>
                            {query.active
                              ? "已启用自动监测"
                              : "已暂停自动监测"}
                          </span>
                          <span>手动录入 {query.responses.length} 条</span>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={saving}
                        onClick={() =>
                          toggleQuery(query.id, !query.active)
                        }
                      >
                        {query.active ? "暂停" : "启用"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={saving}
                        onClick={() => {
                          if (
                            window.confirm(
                              `确定删除关键词「${query.text}」？此操作不可撤销。`
                            )
                          ) {
                            deleteQuery(query.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {query.latestRun ? (
                    <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <QueryRunStatusBadge
                          status={query.latestRun.status}
                        />
                        <span>
                          {new Date(
                            query.latestRun.createdAt
                          ).toLocaleString("zh-CN", { hour12: false })}
                        </span>
                        {query.latestRun.rank ? (
                          <span>排名：{query.latestRun.rank}</span>
                        ) : null}
                        <span>
                          {query.latestRun.mentioned
                            ? "自动结果提到品牌"
                            : "自动结果未提到品牌"}
                        </span>
                      </div>
                      {query.latestRun.errorMessage ? (
                        <p className="mt-2 text-destructive">
                          失败原因：{query.latestRun.errorMessage}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <form action={createResponse} className="flex flex-col gap-3">
                    <input type="hidden" name="queryId" value={query.id} />
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="flex flex-col gap-2">
                        <Label>AI 平台</Label>
                        <Input
                          name="platform"
                          placeholder="ChatGPT / 豆包 / Kimi"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>品牌排名</Label>
                        <Input
                          name="rank"
                          type="number"
                          min="1"
                          placeholder="如 1"
                        />
                      </div>
                      <label className="flex items-end gap-2 text-sm">
                        <input name="mentioned" type="checkbox" />
                        回答中提到了我的品牌
                      </label>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>AI 回答原文</Label>
                      <Textarea
                        name="answer"
                        placeholder="把 AI 的回答复制到这里"
                      />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <Label>竞品</Label>
                        <Input
                          name="competitors"
                          placeholder="逗号分隔，如 A公司，B公司"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>备注</Label>
                        <Input
                          name="notes"
                          placeholder="比如：没提到品牌，但提到竞品"
                        />
                      </div>
                    </div>
                    <Button className="self-start" disabled={saving}>
                      保存手动回答
                    </Button>
                  </form>

                  {query.queryRuns.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-sm font-medium">最近自动运行</p>
                      {query.queryRuns.map((run) => (
                        <div
                          key={run.id}
                          className="rounded-lg border p-3 text-sm"
                        >
                          <div className="flex flex-wrap gap-2">
                            <QueryRunStatusBadge status={run.status} />
                            <span>
                              {new Date(
                                run.createdAt
                              ).toLocaleString("zh-CN", { hour12: false })}
                            </span>
                            <span>
                              {run.mentioned ? "提到品牌" : "未提到品牌"}
                            </span>
                            {run.rank ? (
                              <span>排名：{run.rank}</span>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {query.responses.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <p className="text-sm font-medium">手动录入记录</p>
                      {query.responses.map((response) => (
                        <div
                          key={response.id}
                          className="rounded-lg border p-3 text-sm"
                        >
                          <div className="flex flex-wrap gap-2">
                            <span>{response.platform}</span>
                            <span>
                              {response.mentioned
                                ? "提到品牌"
                                : "未提到品牌"}
                            </span>
                            {response.rank ? (
                              <span>排名：{response.rank}</span>
                            ) : null}
                          </div>
                          <p className="mt-2 line-clamp-3 text-muted-foreground">
                            {response.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Competitors sidebar */}
        <Card>
          <CardHeader>
            <CardTitle>竞品汇总</CardTitle>
            <CardDescription>
              自动监测与手动录入合并汇总。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {competitors.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                暂未发现竞品。
              </p>
            ) : (
              competitors.map((competitor) => (
                <span
                  key={competitor}
                  className="rounded-full border px-3 py-1 text-sm"
                >
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
