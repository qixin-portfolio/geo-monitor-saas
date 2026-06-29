import Link from "next/link"
import { ArrowRight, BarChart3, Search, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
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
    description: "追踪品牌在 ChatGPT、豆包、Kimi、DeepSeek 等主流 AI 问答中的推荐率、提及频次与排名变化，量化品牌 AI 可见度。",
    icon: Search,
  },
  {
    title: "竞品情报",
    description: "发现哪些竞品正在被 AI 提及，对比各品牌的关键词覆盖、推荐场景与回答质量，掌握竞争格局。",
    icon: ShieldCheck,
  },
  {
    title: "趋势看板",
    description: "通过推荐率趋势、竞品对比视图和异常告警，快速判断 GEO 策略效果，让每轮优化都有数据支撑。",
    icon: BarChart3,
  },
]

const platforms = ["ChatGPT", "豆包", "DeepSeek", "Kimi"]

const audienceSegments = [
  {
    title: "品牌市场团队",
    description: "需要掌握品牌在 AI 搜索生态中的真实可见度，评估投放与内容策略的 GEO 效果。",
  },
  {
    title: "内容运营负责人",
    description: "关注品牌内容在 AI 问答中的引用率和推荐排名，优化 SEO / GEO 内容方向。",
  },
  {
    title: "CEO 与品牌决策者",
    description: "了解 AI 时代品牌曝光的新维度，提前布局品牌在生成式搜索结果中的占位。",
  },
]

async function isSignedIn() {
  if (!hasUsableClerkKey()) return false

  try {
    const { auth } = await import("@clerk/nextjs/server")
    const { userId } = await auth()
    return Boolean(userId)
  } catch {
    return false
  }
}

export default async function HomePage() {
  const hasClerk = hasUsableClerkKey()
  const signedIn = await isSignedIn()
  const primaryHref = hasClerk ? (signedIn ? "/dashboard" : "/sign-up") : "/pricing"
  const primaryLabel = hasClerk
    ? signedIn
      ? "进入控制台"
      : "开始免费试用"
    : "查看演示版"

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex max-w-6xl flex-col items-center px-6 py-24 text-center">
        <div className="mb-4">
          <Badge variant="secondary" className="text-sm px-4 py-1.5">
            品牌 AI 可见度监测平台
          </Badge>
        </div>
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
          监测你的品牌是否正在被 AI 推荐
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          当用户问 ChatGPT、豆包、DeepSeek、Kimi 你的品牌时，AI 会怎么回答？
          是否推荐了你的产品？GEO Monitor 帮你追踪品牌在主流 AI 问答平台上的露出、排名和竞品动态，
          让 GEO 优化不再靠猜。
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href={primaryHref}>
              {primaryLabel}{" "}
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

      {/* Supported platforms */}
      <section className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-16">
        <p className="mb-4 text-sm font-medium text-muted-foreground">
          已接入监测平台
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {platforms.map((platform) => (
            <Badge key={platform} variant="outline" className="px-3 py-1 text-sm">
              {platform}
            </Badge>
          ))}
        </div>
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
              覆盖主流 AI 问答平台，持续跟踪品牌可见度变化。
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Target audience */}
      <section className="bg-muted py-20">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">适合这样的你</h2>
          <p className="mt-3 text-muted-foreground">
            GEO Monitor 服务于每一个关注品牌在 AI 时代可见度的团队。
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {audienceSegments.map((segment) => (
              <Card key={segment.title} className="text-left">
                <CardHeader>
                  <CardTitle className="text-lg">{segment.title}</CardTitle>
                  <CardDescription>{segment.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

    </main>
  )
}
