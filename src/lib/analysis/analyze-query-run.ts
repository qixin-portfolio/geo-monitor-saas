import type {
  ImpactLevel,
  MentionStatus,
  Prisma,
  QueryRunAnalysis,
} from "@prisma/client"

import { getPrisma } from "@/lib/prisma"

import { PARSER_VERSION } from "./constants"
import {
  findBrandAliasesMatched,
  getBrandAliases,
  hasRecommendationKeyword,
  normalizeText,
} from "./extract-brand"
import { extractCompetitors } from "./extract-competitors"
import {
  extractCitations,
  extractEvidenceSpans,
  extractReasonTags,
} from "./extract-evidence"
import { extractRank, hasNumberedList } from "./extract-rank"
import {
  calculateParserConfidence,
  calculateVisibilityScore,
} from "./visibility-score"

type AnalysisDraftInput = {
  rawOutput: string
  brandName: string | null
  brandAliases?: string[]
}

export function buildAnalysisDraft({
  rawOutput,
  brandName,
  brandAliases = [],
}: AnalysisDraftInput) {
  const aliases = Array.from(new Set([...getBrandAliases(brandName), ...brandAliases]))
  const brandAliasesMatched = findBrandAliasesMatched({
    rawOutput,
    aliases,
  })
  const brandMentioned = brandAliasesMatched.length > 0
  const rankResult = extractRank({
    rawOutput,
    aliases: brandAliasesMatched.length > 0 ? brandAliasesMatched : aliases,
  })
  const competitors = extractCompetitors({
    rawOutput,
    brandName: brandName ?? "",
    brandAliases: aliases,
  })
  const reasonTags = extractReasonTags(rawOutput)
  const mentionStatus: MentionStatus = !brandMentioned
    ? "NONE"
    : rankResult.recommended
      ? "RECOMMENDED"
      : "MENTIONED"
  const impactLevel: ImpactLevel =
    mentionStatus === "RECOMMENDED"
      ? "POSITIVE"
      : mentionStatus === "MENTIONED"
        ? "NEUTRAL"
        : "NEGATIVE"
  const visibilityScore = calculateVisibilityScore({
    brandMentioned,
    mentionStatus,
    brandRank: rankResult.brandRank,
  })
  const parserConfidence = calculateParserConfidence({
    exactBrandMatched: brandAliasesMatched.some(
      (alias) => normalizeText(alias) === normalizeText(brandName ?? "")
    ),
    hasNumberedList: hasNumberedList(rawOutput),
    hasRecommendationKeyword: hasRecommendationKeyword(rawOutput),
    competitorCount: competitors.length,
    rawOutputLength: rawOutput.length,
  })
  const displayBrandName = brandName?.trim() || "当前品牌"
  const summary =
    mentionStatus === "NONE"
      ? `本次回答没有自然提及${displayBrandName}。AI主要给出了通用筛选建议或推荐了其他竞品，说明当前品牌在该问题下的 AI 可见度不足。`
      : mentionStatus === "MENTIONED"
        ? `本次回答提到了${displayBrandName}，但没有把它作为明确推荐对象。当前品牌具备一定可见度，但推荐强度不足。`
        : `本次回答将${displayBrandName}作为推荐对象，排名为第${rankResult.brandRank ?? "未识别"}位。说明该问题下品牌已具备较好的 AI 可见度。`

  return {
    mentionStatus,
    rankType: rankResult.rankType,
    brandMentioned,
    brandRank: rankResult.brandRank,
    visibilityScore,
    parserConfidence,
    brandAliasesMatched,
    competitors,
    competitorsJson: competitors,
    reasonTags,
    evidenceSpansJson: extractEvidenceSpans({
      rawOutput,
      brandAliasesMatched,
      competitors,
      reasonTags,
    }),
    citationsJson: extractCitations(rawOutput),
    summary,
    impactLevel,
    parserVersion: PARSER_VERSION,
  }
}

export async function analyzeQueryRun(queryRunId: string): Promise<QueryRunAnalysis> {
  const prisma = getPrisma()
  const queryRun = await prisma.queryRun.findUnique({
    where: { id: queryRunId },
    include: {
      query: {
        include: {
          tenant: { include: { brandProfile: true } },
        },
      },
      batch: true,
    },
  })

  if (!queryRun) {
    throw new Error("QueryRun not found")
  }

  if (queryRun.status !== "SUCCESS") {
    throw new Error(`Cannot analyze QueryRun with status ${queryRun.status}`)
  }

  if (!queryRun.rawOutput) {
    throw new Error("Cannot analyze QueryRun without rawOutput")
  }

  const draft = buildAnalysisDraft({
    rawOutput: queryRun.rawOutput,
    brandName: queryRun.query.tenant.brandName,
    brandAliases: queryRun.query.tenant.brandProfile?.brandAliases ?? [],
  })

  const analysisData = {
    mentionStatus: draft.mentionStatus,
    rankType: draft.rankType,
    brandMentioned: draft.brandMentioned,
    brandRank: draft.brandRank,
    visibilityScore: draft.visibilityScore,
    parserConfidence: draft.parserConfidence,
    brandAliasesMatched: draft.brandAliasesMatched,
    competitorsJson: draft.competitorsJson as Prisma.InputJsonValue,
    reasonTags: draft.reasonTags,
    evidenceSpansJson: draft.evidenceSpansJson as Prisma.InputJsonValue,
    citationsJson: draft.citationsJson as Prisma.InputJsonValue,
    summary: draft.summary,
    impactLevel: draft.impactLevel,
    parserVersion: draft.parserVersion,
  }

  const [analysis] = await prisma.$transaction([
    prisma.queryRunAnalysis.upsert({
      where: { queryRunId },
      create: {
        queryRunId,
        ...analysisData,
      },
      update: analysisData,
    }),
    prisma.queryRun.update({
      where: { id: queryRunId },
      data: {
        mentioned: draft.brandMentioned,
        rank: draft.brandRank,
        competitors: draft.competitors.map((competitor) => competitor.name),
      },
    }),
  ])

  return analysis
}
