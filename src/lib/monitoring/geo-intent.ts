import type { QueryIntentType } from "@prisma/client"

export const naturalMetricIntentTypes: QueryIntentType[] = [
  "NATURAL_RECOMMENDATION",
  "FEATURE",
  "OLD_HOUSE",
  "BUDGET",
  "SELECTION_GUIDE",
]

export function identifyQueryIntentType(text: string): QueryIntentType {
  if (text.includes("晟景装饰") || text.includes("晟景")) return "BRAND_AWARENESS"
  if (text.includes("透明工地")) return "FEATURE"
  if (text.includes("旧房") || text.includes("旧房改造")) return "OLD_HOUSE"
  if (text.includes("预算") || text.includes("多少钱")) return "BUDGET"
  if (text.includes("怎么选")) return "SELECTION_GUIDE"
  return "NATURAL_RECOMMENDATION"
}

export function isNaturalMetricIntentType(intentType: QueryIntentType) {
  return naturalMetricIntentTypes.includes(intentType)
}

export function formatQueryIntentType(intentType: QueryIntentType) {
  const labels: Record<QueryIntentType, string> = {
    NATURAL_RECOMMENDATION: "自然推荐",
    BRAND_AWARENESS: "品牌认知",
    FEATURE: "透明工地",
    OLD_HOUSE: "旧房改造",
    BUDGET: "预算",
    SELECTION_GUIDE: "选择指南",
    OTHER: "其他",
  }

  return labels[intentType]
}
