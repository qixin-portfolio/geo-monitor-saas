import type {
  EvidenceGap,
  EvidenceMapItem,
  EvidenceSourceType,
} from "./extract-evidence-map"

export type EvidenceChange = "improved" | "worsened" | "unchanged" | "unknown"

export type BrandMentionChange =
  | "gained"
  | "lost"
  | "unchanged_positive"
  | "unchanged_negative"
  | "unknown"

export type EvidenceRunComparison = {
  query: string
  previousBrandMentioned: boolean | null
  currentBrandMentioned: boolean
  brandMentionChange: BrandMentionChange
  previousCompetitors: string[]
  currentCompetitors: string[]
  competitorChangeSummary: EvidenceChange
  previousSourceTypes: EvidenceSourceType[]
  currentSourceTypes: EvidenceSourceType[]
  sourceTypeChangeSummary: EvidenceChange
  previousEvidenceGap: EvidenceGap | null
  currentEvidenceGap: EvidenceGap
  gapChange: EvidenceChange
  overallChange: EvidenceChange
  reason: string
  confidence: number
}

export type CompareEvidenceRunsInput = {
  previous?: EvidenceMapItem | null
  current: EvidenceMapItem
}

const QUALITY_SOURCE_TYPES: EvidenceSourceType[] = [
  "official_site",
  "authority_media",
  "local_listing",
]

function unique(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)))
}

function gapSeverity(gap: EvidenceGap) {
  if (gap === "competitor_evidence_advantage") return 2
  if (gap === "missing_citable_brand_evidence") return 2
  if (gap === "weak_brand_definition") return 1
  return 0
}

function compareBrandMention(previous: EvidenceMapItem, current: EvidenceMapItem): BrandMentionChange {
  if (!previous.brandMentioned && current.brandMentioned) return "gained"
  if (previous.brandMentioned && !current.brandMentioned) return "lost"
  if (previous.brandMentioned && current.brandMentioned) return "unchanged_positive"
  return "unchanged_negative"
}

function compareCompetitors(previous: EvidenceMapItem, current: EvidenceMapItem): EvidenceChange {
  const previousCompetitors = unique(previous.competitorsMentioned)
  const currentCompetitors = unique(current.competitorsMentioned)

  if (currentCompetitors.length < previousCompetitors.length) return "improved"
  if (currentCompetitors.length > previousCompetitors.length) return "worsened"
  return "unchanged"
}

function hasQualitySource(sourceTypes: EvidenceSourceType[]) {
  return sourceTypes.some((sourceType) => QUALITY_SOURCE_TYPES.includes(sourceType))
}

function isWeakSourceSet(sourceTypes: EvidenceSourceType[]) {
  return sourceTypes.every(
    (sourceType) => sourceType === "unknown" || sourceType === "business_registry"
  )
}

function compareSourceTypes(previous: EvidenceMapItem, current: EvidenceMapItem): EvidenceChange {
  const fallbackSources: EvidenceSourceType[] = ["unknown"]
  const previousSources = previous.sourceTypes.length ? previous.sourceTypes : fallbackSources
  const currentSources = current.sourceTypes.length ? current.sourceTypes : fallbackSources

  if (isWeakSourceSet(previousSources) && hasQualitySource(currentSources)) return "improved"
  if (hasQualitySource(previousSources) && isWeakSourceSet(currentSources)) return "worsened"

  const previousSet = new Set(previousSources)
  const currentSet = new Set(currentSources)
  const same =
    previousSet.size === currentSet.size &&
    Array.from(previousSet).every((sourceType) => currentSet.has(sourceType))

  return same ? "unchanged" : "unknown"
}

function compareEvidenceGap(previous: EvidenceMapItem, current: EvidenceMapItem): EvidenceChange {
  const previousSeverity = gapSeverity(previous.evidenceGap)
  const currentSeverity = gapSeverity(current.evidenceGap)

  if (currentSeverity < previousSeverity) return "improved"
  if (currentSeverity > previousSeverity) return "worsened"
  return "unchanged"
}

function combineOverallChange({
  brandMentionChange,
  competitorChangeSummary,
  sourceTypeChangeSummary,
  gapChange,
}: Pick<
  EvidenceRunComparison,
  "brandMentionChange" | "competitorChangeSummary" | "sourceTypeChangeSummary" | "gapChange"
>): EvidenceChange {
  if (brandMentionChange === "gained") return "improved"
  if (brandMentionChange === "lost") return "worsened"

  const signals = [competitorChangeSummary, sourceTypeChangeSummary, gapChange]
  if (signals.includes("worsened")) return "worsened"
  if (signals.includes("improved")) return "improved"
  if (signals.every((signal) => signal === "unchanged")) return "unchanged"
  return "unknown"
}

function buildReason(comparison: Omit<EvidenceRunComparison, "reason" | "confidence">) {
  if (comparison.overallChange === "unknown") {
    return "历史 run 不足或来源变化不明确，暂时只能标记为数据不足。"
  }

  if (comparison.brandMentionChange === "gained") {
    return "品牌从未提及变成已提及，这是最强的改善信号。"
  }

  if (comparison.brandMentionChange === "lost") {
    return "品牌从已提及变成未提及，需要优先复查页面证据和监测样本。"
  }

  const reasons: string[] = []
  if (comparison.competitorChangeSummary === "improved") reasons.push("竞品提及数量减少")
  if (comparison.competitorChangeSummary === "worsened") reasons.push("竞品提及数量增加")
  if (comparison.sourceTypeChangeSummary === "improved") reasons.push("来源类型变得更可引用")
  if (comparison.sourceTypeChangeSummary === "worsened") reasons.push("来源类型变弱")
  if (comparison.gapChange === "improved") reasons.push("证据缺口优先级下降")
  if (comparison.gapChange === "worsened") reasons.push("证据缺口优先级上升")

  if (reasons.length) return `${reasons.join("，")}。`
  return "品牌、竞品、来源和证据缺口没有明显变化。"
}

function comparisonConfidence(comparison: Omit<EvidenceRunComparison, "reason" | "confidence">) {
  if (comparison.overallChange === "unknown") return 0.35
  if (comparison.brandMentionChange === "gained" || comparison.brandMentionChange === "lost") return 0.86
  if (comparison.gapChange !== "unchanged") return 0.74
  if (comparison.competitorChangeSummary !== "unchanged") return 0.7
  if (comparison.sourceTypeChangeSummary !== "unchanged") return 0.66
  return 0.58
}

export function compareEvidenceRuns({
  previous,
  current,
}: CompareEvidenceRunsInput): EvidenceRunComparison {
  if (!previous) {
    return {
      query: current.query,
      previousBrandMentioned: null,
      currentBrandMentioned: current.brandMentioned,
      brandMentionChange: "unknown",
      previousCompetitors: [],
      currentCompetitors: unique(current.competitorsMentioned),
      competitorChangeSummary: "unknown",
      previousSourceTypes: [],
      currentSourceTypes: current.sourceTypes,
      sourceTypeChangeSummary: "unknown",
      previousEvidenceGap: null,
      currentEvidenceGap: current.evidenceGap,
      gapChange: "unknown",
      overallChange: "unknown",
      reason: "暂无历史对比。完成下一次 Monitoring 后，这里会显示答案变化。",
      confidence: 0.25,
    }
  }

  const brandMentionChange = compareBrandMention(previous, current)
  const competitorChangeSummary = compareCompetitors(previous, current)
  const sourceTypeChangeSummary = compareSourceTypes(previous, current)
  const gapChange = compareEvidenceGap(previous, current)
  const overallChange = combineOverallChange({
    brandMentionChange,
    competitorChangeSummary,
    sourceTypeChangeSummary,
    gapChange,
  })
  const comparison: Omit<EvidenceRunComparison, "reason" | "confidence"> = {
    query: current.query || previous.query,
    previousBrandMentioned: previous.brandMentioned,
    currentBrandMentioned: current.brandMentioned,
    brandMentionChange,
    previousCompetitors: unique(previous.competitorsMentioned),
    currentCompetitors: unique(current.competitorsMentioned),
    competitorChangeSummary,
    previousSourceTypes: previous.sourceTypes,
    currentSourceTypes: current.sourceTypes,
    sourceTypeChangeSummary,
    previousEvidenceGap: previous.evidenceGap,
    currentEvidenceGap: current.evidenceGap,
    gapChange,
    overallChange,
  }

  return {
    ...comparison,
    reason: buildReason(comparison),
    confidence: comparisonConfidence(comparison),
  }
}
