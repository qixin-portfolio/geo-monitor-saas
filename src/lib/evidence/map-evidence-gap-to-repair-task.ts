import type { EvidenceGap, EvidenceMapItem, EvidencePriority } from "./extract-evidence-map"

export type RepairTaskType =
  | "page_update"
  | "new_page"
  | "faq_addition"
  | "schema_fix"
  | "third_party_profile"
  | "review_collection"
  | "authority_building"
  | "sentiment_defense"
  | "competitor_counter"

export type EffortLevel = "S" | "M" | "L"

export type RepairTaskDraft = {
  taskType: RepairTaskType
  priority: EvidencePriority
  title: string
  description: string
  suggestedPage: string
  relatedQuery: string
  evidenceGap: EvidenceGap
  expectedImpact: string
  effortLevel: EffortLevel
  nextSteps: string[]
}

function isSentimentQuery(query: string) {
  return /(负面|投诉|增项|合同|售后|工期|纠纷|坑|避坑)/.test(query)
}

function sourceNeedsSchemaFix(item: EvidenceMapItem) {
  return (
    item.sourceTypes.includes("business_registry") &&
    !item.sourceTypes.includes("official_site")
  )
}

export function mapEvidenceGapToRepairTask(item: EvidenceMapItem): RepairTaskDraft {
  if (isSentimentQuery(item.query)) {
    return {
      taskType: item.evidenceGap === "weak_brand_definition" ? "faq_addition" : "sentiment_defense",
      priority: item.priority,
      title: "补齐风险问题 FAQ 与舆情防御内容",
      description: "当前 query 涉及合同、售后、投诉或增项，优先补充可被 AI 引用的风险解释页面。",
      suggestedPage: item.suggestedPage,
      relatedQuery: item.query,
      evidenceGap: item.evidenceGap,
      expectedImpact: "降低 AI 在风险类问题中只引用竞品或负面来源的概率。",
      effortLevel: "M",
      nextSteps: [
        "列出用户最关心的风险问题。",
        "补充合同边界、售后流程、工期承诺和常见质疑回应。",
        "在页面中加入结构化 FAQ。",
      ],
    }
  }

  if (item.evidenceGap === "competitor_evidence_advantage") {
    return {
      taskType: item.competitorsMentioned.length > 1 ? "competitor_counter" : "new_page",
      priority: item.priority,
      title: "补齐竞品对比与本地推荐证据",
      description: "AI 已提到竞品但没有提到本品牌，需要用页面内容补足推荐理由和对比证据。",
      suggestedPage: item.suggestedPage,
      relatedQuery: item.query,
      evidenceGap: item.evidenceGap,
      expectedImpact: "提升本品牌进入同类推荐答案的概率。",
      effortLevel: "M",
      nextSteps: [
        "整理竞品被提及的卖点。",
        "补充本品牌差异化案例、客户评价和服务承诺。",
        "制作本地装修公司选择或对比页面。",
      ],
    }
  }

  if (item.evidenceGap === "missing_citable_brand_evidence") {
    return {
      taskType: "new_page",
      priority: item.priority,
      title: "新增可被 AI 引用的品牌证据页",
      description: "AI 没有找到清晰品牌证据，先补一个能解释品牌、服务、案例和口碑的页面。",
      suggestedPage: item.suggestedPage,
      relatedQuery: item.query,
      evidenceGap: item.evidenceGap,
      expectedImpact: "为后续 AI 答案提供稳定引用入口。",
      effortLevel: "M",
      nextSteps: [
        "围绕 query 写清用户场景。",
        "补充真实案例、服务范围和评价证据。",
        "增加 FAQ，覆盖用户常见追问。",
      ],
    }
  }

  if (item.evidenceGap === "weak_brand_definition") {
    return {
      taskType: "page_update",
      priority: item.priority,
      title: "更新品牌介绍页和核心服务页",
      description: "AI 已知道品牌，但品牌优势定义不足，需要强化官网页面里的可引用表达。",
      suggestedPage: item.suggestedPage,
      relatedQuery: item.query,
      evidenceGap: item.evidenceGap,
      expectedImpact: "提高 AI 从知道品牌到愿意推荐品牌的概率。",
      effortLevel: "S",
      nextSteps: [
        "把品牌优势写成清晰小标题。",
        "加入本地案例、施工标准和客户评价。",
        "补充页面内链到相关案例和 FAQ。",
      ],
    }
  }

  if (sourceNeedsSchemaFix(item)) {
    return {
      taskType: "schema_fix",
      priority: item.priority,
      title: "补强官网品牌定义与结构化信息",
      description: "AI 当前更依赖工商信息，说明官网或业务页面对品牌定位的定义不够强。",
      suggestedPage: item.suggestedPage,
      relatedQuery: item.query,
      evidenceGap: item.evidenceGap,
      expectedImpact: "让 AI 在识别品牌时同时看到业务优势、服务范围和可引用页面。",
      effortLevel: "S",
      nextSteps: [
        "检查官网品牌介绍和本地服务页。",
        "补充 Organization / LocalBusiness / FAQ 结构化信息。",
        "把案例、评价和服务范围链接到核心页面。",
      ],
    }
  }

  return {
    taskType: "page_update",
    priority: item.priority,
    title: "持续维护当前证据页面",
    description: "当前没有高优先级证据缺口，保持页面内容更新和后续监测。",
    suggestedPage: item.suggestedPage,
    relatedQuery: item.query,
    evidenceGap: item.evidenceGap,
    expectedImpact: "稳定已获得的 AI 可见度。",
    effortLevel: "S",
    nextSteps: ["定期更新案例和 FAQ。", "继续观察下一轮 run 的答案变化。"],
  }
}
