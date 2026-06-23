import type { Plan } from "@prisma/client"

export const PLANS: Record<
  Plan,
  {
    name: string
    price: number
    queryLimit: number
    monitoringFrequency: string
    description: string
    features: string[]
  }
> = {
  FREE: {
    name: "Free",
    price: 0,
    queryLimit: 3,
    monitoringFrequency: "manual",
    description: "适合先验证一个品牌是否被 AI 推荐。",
    features: ["3 个关键词", "手动录入 AI 回答", "基础推荐率看板"],
  },
  STARTER: {
    name: "Starter",
    price: 19,
    queryLimit: 5,
    monitoringFrequency: "weekly",
    description: "适合单品牌做第一轮 GEO 验证。",
    features: ["5 个关键词", "手动监测记录", "竞品提及分析"],
  },
  PRO: {
    name: "Pro",
    price: 49,
    queryLimit: 30,
    monitoringFrequency: "daily",
    description: "适合成长型企业持续追踪 AI 推荐入口。",
    features: ["30 个关键词", "多平台回答记录", "关键词覆盖分析"],
  },
  AGENCY: {
    name: "Agency",
    price: 199,
    queryLimit: 9999,
    monitoringFrequency: "daily",
    description: "适合代运营团队和多客户项目。",
    features: ["大量关键词", "客户演示看板", "代理业务预留"],
  },
}

export function getPlanLimit(plan: Plan) {
  return PLANS[plan].queryLimit
}

export function canCreateQuery(plan: Plan, currentCount: number) {
  return currentCount < getPlanLimit(plan)
}

export function isPaidPlan(plan: Plan) {
  return plan === "STARTER" || plan === "PRO" || plan === "AGENCY"
}

export function getStripePriceId(plan: string) {
  if (plan === "STARTER") return process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID
  if (plan === "PRO") return process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
  if (plan === "AGENCY") return process.env.NEXT_PUBLIC_STRIPE_AGENCY_PRICE_ID
  return null
}
