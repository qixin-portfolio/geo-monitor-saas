"use client"

import { useMemo, useState } from "react"
import type { Plan } from "@prisma/client"

import { Paywall } from "@/components/paywall"
import { PlanBadge } from "@/components/plan-badge"
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

type QueryItem = {
  id: string
  text: string
  platform: string
  responses: ManualResponse[]
}

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

  const limit = getPlanLimit(tenant.plan)
  const reachedLimit = queries.length >= limit
  const responseCount = queries.reduce(
    (sum, query) => sum + query.responses.length,
    0
  )
  const mentionedCount = queries.reduce(
    (sum, query) =>
      sum + query.responses.filter((response) => response.mentioned).length,
    0
  )
  const recommendationRate = responseCount
    ? Math.round((mentionedCount / responseCount) * 100)
    : 0

  const competitors = useMemo(() => {
    return Array.from(
      new Set([
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
          responses: [],
        },
        ...current,
      ])
      setQueryText("")
    } finally {
      setSaving(false)
    }
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
        current.map((query) =>
          query.id === data.response.queryId
            ? { ...query, responses: [data.response, ...query.responses] }
            : query
        )
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">当前套餐</CardTitle>
          </CardHeader>
          <CardContent>
            <PlanBadge plan={tenant.plan} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">关键词</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {queries.length}/{limit}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">监测记录</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{responseCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">AI 推荐率</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {recommendationRate}%
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>品牌设置</CardTitle>
          <CardDescription>
            先填品牌、行业和地区，后续录入会围绕这个企业空间做统计。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <div className="flex flex-col gap-2">
            <Label htmlFor="brandName">品牌名</Label>
            <Input
              id="brandName"
              value={brandName}
              onChange={(event) => setBrandName(event.target.value)}
              placeholder="例如：晟景装饰"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="industry">行业</Label>
            <Input
              id="industry"
              value={industry}
              onChange={(event) => setIndustry(event.target.value)}
              placeholder="例如：装修"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="region">地区</Label>
            <Input
              id="region"
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              placeholder="例如：交城"
            />
          </div>
          <Button className="self-end" disabled={saving} onClick={saveTenant}>
            保存
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>添加关键词</CardTitle>
          <CardDescription>
            示例：交城装修公司哪家靠谱？本地装修公司推荐？
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row">
          <Input
            value={queryText}
            onChange={(event) => setQueryText(event.target.value)}
            placeholder="输入你要去问 AI 的问题"
          />
          <Button disabled={saving || reachedLimit} onClick={createQuery}>
            添加关键词
          </Button>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {reachedLimit ? <Paywall /> : null}

      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="flex flex-col gap-4">
          {queries.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>还没有关键词</CardTitle>
                <CardDescription>
                  先添加一个客户会问 AI 的问题，再把 AI 回答手动录进来。
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            queries.map((query) => (
              <Card key={query.id}>
                <CardHeader>
                  <CardTitle>{query.text}</CardTitle>
                  <CardDescription className="mt-2">
                    已录入 {query.responses.length} 条回答
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <form action={createResponse} className="flex flex-col gap-3">
                    <input type="hidden" name="queryId" value={query.id} />
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="flex flex-col gap-2">
                        <Label>AI 平台</Label>
                        <Input name="platform" placeholder="ChatGPT / 豆包 / Kimi" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>品牌排名</Label>
                        <Input name="rank" type="number" min="1" placeholder="如 1" />
                      </div>
                      <label className="flex items-end gap-2 text-sm">
                        <input name="mentioned" type="checkbox" />
                        回答中提到了我的品牌
                      </label>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>AI 回答原文</Label>
                      <Textarea name="answer" placeholder="把 AI 的回答复制到这里" />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <Label>竞品</Label>
                        <Input name="competitors" placeholder="逗号分隔，如 A公司，B公司" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>备注</Label>
                        <Input name="notes" placeholder="比如：没提到品牌，但提到竞品" />
                      </div>
                    </div>
                    <Button className="self-start" disabled={saving}>
                      保存回答
                    </Button>
                  </form>

                  <div className="flex flex-col gap-2">
                    {query.responses.map((response) => (
                      <div key={response.id} className="rounded-lg border p-3 text-sm">
                        <div className="flex flex-wrap gap-2">
                          <span>{response.platform}</span>
                          <span>{response.mentioned ? "提到品牌" : "未提到品牌"}</span>
                          {response.rank ? <span>排名：{response.rank}</span> : null}
                        </div>
                        <p className="mt-2 line-clamp-3 text-muted-foreground">
                          {response.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>竞品汇总</CardTitle>
            <CardDescription>根据手动录入自动汇总。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {competitors.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂未发现竞品。</p>
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
