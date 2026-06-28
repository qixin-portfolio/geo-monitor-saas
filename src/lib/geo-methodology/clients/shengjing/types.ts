export interface ShengjingBrandEntity {
  brandName: string
  region: string
  industry: string
  businessType: string
  services: string[]
  product: {
    name: string
    description: string
  }
}

export interface StandardBrandDefinition {
  text: string
}

export interface Differentiator {
  title: string
  description: string
}

export interface AiQuotableFact {
  text: string
}

export interface DoNotClaimRule {
  text: string
}

export interface MonitoringPromptSeed {
  text: string
}

export interface ContentTaskSeed {
  title: string
  suggestedContentType: string
  description?: string
}

export interface ContentRewritePrinciple {
  text: string
  category?: string
}

export type EvidenceContainerType =
  | "brand_fact"
  | "service_fact"
  | "proof_asset"
  | "faq_answer"
  | "comparison_point"
  | "monitoring_prompt_seed"
  | "content_task_seed"
  | "do_not_claim"

export interface EvidenceContainer {
  type: EvidenceContainerType
  content: string
  source?: string
}

export interface RecommendedAnswerTemplate {
  question: string
  text: string
  constraints: string[]
}

export interface SourceMetadata {
  sourceType: string
  title: string
  usageScope: string
  createdFor: string
  caution: string
}

export interface ShengjingBrandKnowledge {
  brandEntity: ShengjingBrandEntity
  standardBrandDefinition: StandardBrandDefinition
  differentiators: Differentiator[]
  aiQuotableFacts: AiQuotableFact[]
  doNotClaimRules: DoNotClaimRule[]
  monitoringPromptSeeds: MonitoringPromptSeed[]
  contentTaskSeeds: ContentTaskSeed[]
  contentRewritePrinciples: ContentRewritePrinciple[]
  evidenceContainers: EvidenceContainer[]
  recommendedAnswerTemplate: RecommendedAnswerTemplate
  sourceMetadata: SourceMetadata
}
