import type { AnswerSourceDraft } from "./extract-answer-sources"
import type { EvidenceMapItem, EvidenceSourceType } from "./extract-evidence-map"
import type { EvidenceRunComparison } from "./compare-evidence-runs"

export type EvidenceConfidenceLevel = "high" | "medium" | "low"

export type EvidenceConfidenceLabel = {
  confidenceLevel: EvidenceConfidenceLevel
  confidenceScore: number
  reasons: string[]
  warnings: string[]
}

export type ClassifyEvidenceConfidenceInput = {
  evidenceItem: Pick<
    EvidenceMapItem,
    "brandMentioned" | "competitorsMentioned" | "sourceTypes"
  >
  answerSources?: AnswerSourceDraft[] | null
  answer?: string | null
  summary?: string | null
  citationsJson?: unknown
  sourcesJson?: unknown
  comparison?: EvidenceRunComparison | null
}

const URL_PATTERN = /https?:\/\/[^\s)\]}>"']+/
const QUALITY_SOURCE_TYPES: EvidenceSourceType[] = [
  "official_site",
  "local_listing",
  "authority_media",
]

type StructuredSourceInspection = {
  provided: boolean
  parseFailed: boolean
  hasUrl: boolean
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)))
}

function hasUrl(value: string) {
  return URL_PATTERN.test(value)
}

function inspectStructuredSource(value: unknown): StructuredSourceInspection {
  if (value === null || value === undefined || value === "") {
    return { provided: false, parseFailed: false, hasUrl: false }
  }

  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return { provided: false, parseFailed: false, hasUrl: false }

    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return inspectStructuredSource(JSON.parse(trimmed))
      } catch {
        return {
          provided: true,
          parseFailed: true,
          hasUrl: hasUrl(trimmed),
        }
      }
    }

    return { provided: true, parseFailed: false, hasUrl: hasUrl(trimmed) }
  }

  if (Array.isArray(value)) {
    const inspected = value.map((item) => inspectStructuredSource(item))
    return {
      provided: true,
      parseFailed: inspected.some((item) => item.parseFailed),
      hasUrl: inspected.some((item) => item.hasUrl),
    }
  }

  if (typeof value === "object") {
    const inspected = Object.values(value as Record<string, unknown>).map((item) =>
      inspectStructuredSource(item)
    )
    return {
      provided: true,
      parseFailed: inspected.some((item) => item.parseFailed),
      hasUrl: inspected.some((item) => item.hasUrl),
    }
  }

  return { provided: true, parseFailed: false, hasUrl: false }
}

function hasOnlyUnknownSource(sourceTypes: EvidenceSourceType[]) {
  return sourceTypes.length === 0 || sourceTypes.every((sourceType) => sourceType === "unknown")
}

function hasQualitySource(sourceTypes: EvidenceSourceType[]) {
  return sourceTypes.some((sourceType) => QUALITY_SOURCE_TYPES.includes(sourceType))
}

function buildLevel(score: number): EvidenceConfidenceLevel {
  if (score >= 75) return "high"
  if (score >= 45) return "medium"
  return "low"
}

export function classifyEvidenceConfidence(
  input: ClassifyEvidenceConfidenceInput
): EvidenceConfidenceLabel {
  const answerText = [input.answer, input.summary]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join("\n")
    .trim()
  const answerSources = input.answerSources ?? []
  const citationsInspection = inspectStructuredSource(input.citationsJson)
  const sourcesInspection = inspectStructuredSource(input.sourcesJson)
  const structuredSourceProvided = citationsInspection.provided || sourcesInspection.provided
  const structuredParseFailed = citationsInspection.parseFailed || sourcesInspection.parseFailed
  const structuredUrlFound =
    citationsInspection.hasUrl ||
    sourcesInspection.hasUrl ||
    answerSources.some(
      (source) =>
        source.url &&
        (source.extractionMethod === "citations_json" ||
          source.extractionMethod === "sources_json")
    )
  const textUrlFound = answerSources.some(
    (source) =>
      source.url &&
      (source.extractionMethod === "answer_url" ||
        source.extractionMethod === "summary_url")
  )
  const sourceTypes = input.evidenceItem.sourceTypes
  const onlyUnknownSource = hasOnlyUnknownSource(sourceTypes)
  const qualitySourceFound =
    hasQualitySource(sourceTypes) ||
    answerSources.some((source) => QUALITY_SOURCE_TYPES.includes(source.sourceType))
  const nonUnknownSourceFound =
    !onlyUnknownSource || answerSources.some((source) => source.sourceType !== "unknown")
  const previousRunMissing =
    input.comparison?.previousBrandMentioned === null ||
    input.comparison?.brandMentionChange === "unknown"

  const reasons: string[] = []
  const warnings: string[] = []
  let score = 20

  if (answerText.length >= 20) {
    score += 10
  } else {
    score -= 25
    warnings.push("answer / summary 为空或过短")
  }

  if (input.evidenceItem.brandMentioned) {
    score += 20
    reasons.push("明确命中品牌名")
  }

  if (input.evidenceItem.competitorsMentioned.length > 0) {
    score += 15
    reasons.push(`明确命中竞品名：${input.evidenceItem.competitorsMentioned.join("、")}`)
  }

  if (structuredUrlFound) {
    score += 30
    reasons.push("citationsJson / sourcesJson 中存在可解析 URL")
  } else if (!structuredSourceProvided) {
    score -= 10
    warnings.push("没有可解析 citation/source URL")
  }

  if (textUrlFound) {
    score += 12
    reasons.push("从 answer / summary 文本 URL 提取来源")
  }

  if (nonUnknownSourceFound) {
    score += 15
    reasons.push("sourceType 不是 unknown")
  } else {
    score -= 20
    warnings.push("sourceType 为 unknown 或来源不足")
  }

  if (qualitySourceFound) {
    score += 18
    reasons.push("命中官网、本地列表或权威媒体来源")
  }

  if (!structuredUrlFound && nonUnknownSourceFound && answerText.length >= 20) {
    score += 8
    reasons.push("基于 answer / summary 文本关键词推断")
  }

  if (structuredParseFailed) {
    score -= 25
    warnings.push("citationsJson / sourcesJson 解析失败")
  }

  if (answerSources.length === 0) {
    score -= 10
    warnings.push("未提取到 AnswerSource")
  }

  if (input.comparison) {
    if (previousRunMissing || input.comparison.overallChange === "unknown") {
      score -= 20
      warnings.push("缺少历史 run，前后变化只能标记为数据不足")
    } else {
      score += 10
      reasons.push("存在可对比的历史 run")
    }
  }

  let confidenceScore = clampScore(score)

  if (!answerText) {
    confidenceScore = Math.min(confidenceScore, 30)
  }

  if (structuredParseFailed && !structuredUrlFound) {
    confidenceScore = Math.min(confidenceScore, 35)
  }

  if (
    onlyUnknownSource &&
    !structuredUrlFound &&
    !textUrlFound &&
    !input.evidenceItem.brandMentioned &&
    input.evidenceItem.competitorsMentioned.length === 0
  ) {
    confidenceScore = Math.min(confidenceScore, 35)
  }

  if (
    previousRunMissing &&
    !structuredUrlFound &&
    !textUrlFound &&
    !input.evidenceItem.brandMentioned &&
    input.evidenceItem.competitorsMentioned.length === 0
  ) {
    confidenceScore = Math.min(confidenceScore, 35)
  }

  if (
    input.evidenceItem.competitorsMentioned.length > 0 &&
    answerText.length >= 20 &&
    !structuredParseFailed
  ) {
    confidenceScore = Math.max(confidenceScore, 50)
  }

  if (reasons.length === 0) {
    reasons.push("当前只基于有限答案与来源信息做系统推断")
  }

  return {
    confidenceLevel: buildLevel(confidenceScore),
    confidenceScore,
    reasons,
    warnings,
  }
}
