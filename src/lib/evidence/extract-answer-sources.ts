import {
  type EvidenceSourceType,
  inferEvidenceSourceTypes,
} from "./extract-evidence-map"

export type AnswerSourceExtractionMethod =
  | "citations_json"
  | "sources_json"
  | "answer_url"
  | "summary_url"

export type AnswerSourceDraft = {
  url: string | null
  domain: string | null
  title: string | null
  snippet: string | null
  sourceType: EvidenceSourceType
  isOwned: boolean
  isCompetitor: boolean
  confidence: number
  extractionMethod: AnswerSourceExtractionMethod
}

export type ExtractAnswerSourcesInput = {
  citationsJson?: unknown
  sourcesJson?: unknown
  answer?: string | null
  summary?: string | null
  ownedDomains?: string[] | null
  competitorNames?: string[] | null
}

type SourceLike = {
  url?: unknown
  link?: unknown
  href?: unknown
  domain?: unknown
  title?: unknown
  name?: unknown
  snippet?: unknown
  text?: unknown
  sourceType?: unknown
}

const URL_PATTERN = /https?:\/\/[^\s)\]}>"']+/g

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function toArray(value: unknown): unknown[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === "string") {
    try {
      return toArray(JSON.parse(value))
    } catch {
      return value.match(URL_PATTERN) ?? []
    }
  }
  return [value]
}

function normalizeDomain(value: string | null) {
  if (!value) return null
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split(/[/?#]/)[0]
  return normalized || null
}

function domainFromUrl(url: string | null) {
  if (!url) return null
  try {
    return normalizeDomain(new URL(url).hostname)
  } catch {
    return normalizeDomain(url)
  }
}

function includesAny(text: string, candidates: string[]) {
  const normalizedText = text.toLowerCase()
  return candidates.some((candidate) => {
    const normalized = candidate.trim().toLowerCase()
    return normalized ? normalizedText.includes(normalized) : false
  })
}

function classifySourceType(text: string, explicitSourceType?: string | null): EvidenceSourceType {
  const allowedTypes = new Set<EvidenceSourceType>([
    "business_registry",
    "short_video",
    "xiaohongshu",
    "zhihu",
    "wechat",
    "official_site",
    "local_listing",
    "authority_media",
    "unknown",
  ])

  if (explicitSourceType && allowedTypes.has(explicitSourceType as EvidenceSourceType)) {
    return explicitSourceType as EvidenceSourceType
  }

  return inferEvidenceSourceTypes(text)[0] ?? "unknown"
}

function buildSource({
  raw,
  extractionMethod,
  ownedDomains,
  competitorNames,
}: {
  raw: unknown
  extractionMethod: AnswerSourceExtractionMethod
  ownedDomains: string[]
  competitorNames: string[]
}): AnswerSourceDraft | null {
  const item = typeof raw === "object" && raw !== null ? (raw as SourceLike) : null
  const rawUrl = item
    ? asString(item.url) ?? asString(item.link) ?? asString(item.href)
    : asString(raw)
  const url = rawUrl?.match(URL_PATTERN)?.[0] ?? rawUrl
  const domain = normalizeDomain(asString(item?.domain) ?? domainFromUrl(url))
  const title = asString(item?.title) ?? asString(item?.name)
  const snippet = asString(item?.snippet) ?? asString(item?.text)
  const haystack = [url, domain, title, snippet].filter(Boolean).join(" ")

  if (!haystack) return null

  const sourceType = classifySourceType(haystack, asString(item?.sourceType))
  const isOwned = domain ? ownedDomains.includes(domain) : false
  const isCompetitor = includesAny(haystack, competitorNames)

  return {
    url: url ?? null,
    domain,
    title,
    snippet,
    sourceType,
    isOwned,
    isCompetitor,
    confidence: extractionMethod.endsWith("_json") ? 0.82 : 0.62,
    extractionMethod,
  }
}

function sourcesFromText(text: string | null | undefined, extractionMethod: AnswerSourceExtractionMethod) {
  if (!text) return []
  return text.match(URL_PATTERN)?.map((url) => ({ url })) ?? []
}

export function extractAnswerSources(input: ExtractAnswerSourcesInput): AnswerSourceDraft[] {
  const ownedDomains = (input.ownedDomains ?? [])
    .map((domain) => normalizeDomain(domain))
    .filter(Boolean) as string[]
  const competitorNames = (input.competitorNames ?? []).filter(Boolean)
  const rawSources = [
    ...toArray(input.citationsJson).map((raw) => ({ raw, method: "citations_json" as const })),
    ...toArray(input.sourcesJson).map((raw) => ({ raw, method: "sources_json" as const })),
    ...sourcesFromText(input.answer, "answer_url").map((raw) => ({ raw, method: "answer_url" as const })),
    ...sourcesFromText(input.summary, "summary_url").map((raw) => ({ raw, method: "summary_url" as const })),
  ]

  const seen = new Set<string>()
  const sources: AnswerSourceDraft[] = []

  for (const source of rawSources) {
    const draft = buildSource({
      raw: source.raw,
      extractionMethod: source.method,
      ownedDomains,
      competitorNames,
    })
    if (!draft) continue

    const key = draft.url ?? `${draft.domain}:${draft.title}:${draft.snippet}`
    if (seen.has(key)) continue
    seen.add(key)
    sources.push(draft)
  }

  return sources
}
