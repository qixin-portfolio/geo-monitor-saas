import Link from "next/link"
import { ArrowRight, BarChart3, Search, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { hasUsableClerkKey } from "@/lib/clerk-config"

const features = [
  {
    title: "AI 推荐监测",
    description: "记录 ChatGPT、豆包、Kimi、DeepSeek 对行业问题的回答。",
    icon: Search,
  },
  {
    title: "竞品发现",
    description: "看清楚哪些竞品正在被 AI 提到，自己有没有被替代。",
    icon: ShieldCheck,
  },
  {
    title: "推荐率看板",
    description: "用推荐率、提及次数、排名和关键词覆盖来判断 GEO 状态。",
    icon: BarChart3,
  },
]

export default function HomePage() {
  const hasClerk = hasUsableClerkKey()

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex max-w-6xl flex-col items-center px-6 py-24 text-center">
        <div className="mb-4 rounded-full border px-4 py-1 text-sm text-muted-foreground">
          GEO Monitor SaaS MVP
        </div>
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
          监测你的品牌是否正在被 AI 推荐
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          先从手动 GEO 监测开始：把 AI 的回答录入系统，立刻看到品牌提及、排名、竞品和关键词覆盖。
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href={hasClerk ? "/sign-up" : "/pricing"}>
              {hasClerk ? "开始免费试用" : "查看演示版"}{" "}
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/pricing">查看套餐</Link>
          </Button>
        </div>
        {!hasClerk ? (
          <p className="mt-4 text-sm text-muted-foreground">
            当前预览版未接入正式登录与支付配置，可先查看页面与交互骨架。
          </p>
        ) : null}
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-24 md:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <feature.icon data-icon="inline-start" />
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              第一版不做自动爬虫，不做复杂队列，先把真实业务价值跑通。
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  )
}
