import { PricingCard } from "@/components/pricing-card"
import { hasUsableClerkKey } from "@/lib/clerk-config"
import { PLANS } from "@/lib/plans"

export default function PricingPage() {
  const hasClerk = hasUsableClerkKey()
  const plans = [
    ["FREE", "HK$0/月"],
    ["STARTER", "HK$19/月"],
    ["PRO", "HK$49/月"],
    ["AGENCY", "HK$199/月"],
  ] as const

  return (
    <main className="mx-auto max-w-6xl px-6 py-20">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Pricing</p>
        <h1 className="mt-3 text-4xl font-semibold">选择你的 GEO 监测套餐</h1>
        <p className="mt-4 text-muted-foreground">
          第一版先用 Stripe 测试模式验证订阅闭环，真实收费前再接正式账户。
        </p>
        {!hasClerk ? (
          <p className="mt-3 text-sm text-muted-foreground">
            当前是预览模式，未配置 Clerk 时会禁用注册和订阅按钮。
          </p>
        ) : null}
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-4">
        {plans.map(([plan, price]) => (
          <PricingCard
            key={plan}
            name={PLANS[plan].name}
            price={price}
            description={PLANS[plan].description}
            features={PLANS[plan].features}
            plan={plan}
          />
        ))}
      </div>
    </main>
  )
}
