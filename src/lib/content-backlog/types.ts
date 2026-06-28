import type { GeoContentTaskType, GeoContentTaskStatus } from "@prisma/client"
import type { GeoMethodologyQualityAssessment } from "@/lib/geo-methodology/skills/yao-geo-article-friendly"

export type TaskType = GeoContentTaskType
export type TaskStatus = GeoContentTaskStatus

export type TaskEvidenceSpan = {
  type: string
  entity: string
  text: string
  start?: number
  end?: number
}

export type TaskDraftInput = {
  tenantId: string
  queryRunId: string
  analysisId?: string | null
  sourceQuery: string
  sourceProvider?: string | null
  sourceModel?: string | null
  mentionStatus: string
  rankType?: string | null
  brandMentioned?: boolean
  brandRank?: number | null
  visibilityScore?: number
  parserConfidence?: number
  queryIntentType?: string | null
  competitors: string[]
  reasonTags?: string[]
  evidenceSpans?: TaskEvidenceSpan[]
  summary?: string | null
  brandName: string
  region?: string | null
  industry?: string | null
}

export type BriefJson = {
  audience: string
  searchIntent: string
  angle: string
  differentiationTargets: string[]
  forbiddenClaims: string[]
  evidenceNeeded: string[]
  outline: string[]
  internalLinks: string[]
  llmsNotes: string[]
  methodology?: {
    sourceMetadata: {
      skillId: string
      title: string
      author: string
      maintainer: string
      sourceName: string
      sourceUrl: string
      license: string
      retrievedAt: string
      usageScope: string
    }
    scope: {
      appliesArticleStructure: boolean
      appliedRules: string[]
    }
    articleStructureChecklist: string[]
    evidenceBoundaryRules: string[]
    geoScoreRubric: Array<{
      dimension: string
      weight: number
      check: string
    }>
    semanticDensityRules: string[]
    aiCitationReadinessChecklist: string[]
    riskControlRules: string[]
    supplementRequestRules: string[]
    changeNotesTemplate: Record<string, string>
    qualityAssessment: GeoMethodologyQualityAssessment
  }
}

export type GenerateResult = {
  created: Array<{ id: string; title: string; type: TaskType }>
  existing: Array<{ id: string; title: string; type: TaskType }>
}
