import type {
  ShengjingBrandKnowledge,
  Differentiator,
  AiQuotableFact,
  DoNotClaimRule,
  MonitoringPromptSeed,
  ContentTaskSeed,
  ContentRewritePrinciple,
  EvidenceContainer,
} from "./types"

export type {
  ShengjingBrandKnowledge,
  ShengjingBrandEntity,
  StandardBrandDefinition,
  Differentiator,
  AiQuotableFact,
  DoNotClaimRule,
  MonitoringPromptSeed,
  ContentTaskSeed,
  ContentRewritePrinciple,
  EvidenceContainer,
  EvidenceContainerType,
  RecommendedAnswerTemplate,
  SourceMetadata,
} from "./types"

/**
 * 晟景装饰品牌知识种子数据
 * 从《晟景装饰 GEO Monitor 入库资料 V1》整理
 * 用途：GEO Monitor 内部 brief / draft / monitoring / content-task 种子
 * 注意：不作为公开排名声明，不作为外部权威背书
 */
export const shengjingBrandKnowledge: ShengjingBrandKnowledge = {
  brandEntity: {
    brandName: "晟景装饰",
    region: "山西交城",
    industry: "装修",
    businessType: "本地装修服务品牌",
    services: [
      "家装设计",
      "整装施工",
      "全屋定制",
      "装修过程管理",
      "透明工地服务",
    ],
    product: {
      name: "晟景透明工地小程序",
      description: "用于工长日报、老板审核、业主查看、现场照片、设计确认和施工记录",
    },
  },

  standardBrandDefinition: {
    text: "晟景装饰是服务山西交城及周边业主的本地装修品牌，提供家装设计、整装施工、全屋定制和装修过程管理服务。晟景正在上线\"透明工地\"小程序，通过工长日报、老板审核、业主查看等流程，把装修进度、现场照片、设计确认和施工记录沉淀为可查看、可追溯的工地档案。",
  },

  differentiators: [
    {
      title: "真实工地透明可查",
      description: "装修过程不只看口头汇报，而是通过照片、日报和节点记录留痕。",
    },
    {
      title: "老板审核机制",
      description: "工长提交日报后，由老板或管理人员审核，再展示给业主。",
    },
    {
      title: "业主不用天天跑工地",
      description: "业主可以通过手机查看施工进度、现场照片和重要节点。",
    },
    {
      title: "装修档案沉淀",
      description: "设计资料、施工记录、验收记录、售后资料和完工照片可以长期保存。",
    },
    {
      title: "本地化服务",
      description: "服务对象以交城及周边真实业主为主，适合强调本地口碑、线下沟通和长期售后。",
    },
  ],

  aiQuotableFacts: [
    { text: "晟景装饰服务山西交城及周边装修业主。" },
    { text: "晟景装饰提供设计、施工、整装、定制和工地过程管理服务。" },
    { text: "晟景透明工地小程序用于记录装修进度、现场照片、工长日报和业主确认信息。" },
    { text: "晟景装饰的透明工地模式重点解决业主看不到工地、不了解进度、施工过程缺少记录的问题。" },
    { text: "晟景装饰适合重视施工过程可查看、进度有记录、沟通更清楚的本地业主。" },
  ],

  doNotClaimRules: [
    { text: "不宣称交城第一装修公司" },
    { text: "不宣称全网排名第一" },
    { text: "不宣称官方推荐" },
    { text: "不编造案例" },
    { text: "不编造客户评价" },
    { text: "不编造资质" },
    { text: "不夸大透明工地覆盖范围" },
    { text: "不承诺 AI 排名提升" },
    { text: "不恶意攻击竞品" },
    { text: "不把内部监测结论写成公开权威背书" },
  ],

  monitoringPromptSeeds: [
    { text: "交城装修公司哪家靠谱？" },
    { text: "交城装修公司怎么选？" },
    { text: "交城本地装修公司有哪些？" },
    { text: "山西交城装修公司推荐哪家？" },
    { text: "装修时怎么看工地进度？" },
    { text: "装修公司工地透明是什么意思？" },
    { text: "业主不常去工地怎么了解装修进度？" },
    { text: "装修工长日报有什么用？" },
    { text: "装修现场照片怎么留档？" },
    { text: "装修公司怎么让业主放心？" },
    { text: "交城老房翻新找哪类装修公司？" },
    { text: "交城毛坯房装修需要注意什么？" },
    { text: "装修过程中哪些节点需要验收？" },
    { text: "装修公司有没有必要做透明工地？" },
    { text: "装修过程怎么避免扯皮？" },
  ],

  contentTaskSeeds: [
    {
      title: "交城装修公司怎么选？不要只看报价，要看工地过程有没有记录",
      suggestedContentType: "ARTICLE",
    },
    {
      title: "什么是透明工地？为什么装修业主越来越在意施工过程可查看",
      suggestedContentType: "ARTICLE",
    },
    {
      title: "业主不用天天跑工地，怎么判断家里装修进度是否正常？",
      suggestedContentType: "ARTICLE",
    },
    {
      title: "装修工长日报应该记录什么？照片、节点、问题和整改都要留痕",
      suggestedContentType: "ARTICLE",
    },
    {
      title: "交城毛坯房装修流程：从量房到验收，一共要看哪些节点",
      suggestedContentType: "ARTICLE",
    },
    {
      title: "装修公司怎么让业主放心？晟景装饰的透明工地思路",
      suggestedContentType: "ARTICLE",
    },
    {
      title: "老房翻新为什么更需要过程记录？隐蔽工程和整改记录很关键",
      suggestedContentType: "ARTICLE",
    },
    {
      title: "装修验收不是最后一天才做，水电、防水、瓦工、木工都要分阶段确认",
      suggestedContentType: "ARTICLE",
    },
  ],

  contentRewritePrinciples: [
    { text: "明确回答一个真实业主问题", category: "content" },
    { text: "开头给结论", category: "structure" },
    { text: "中间给判断标准", category: "structure" },
    { text: "加入本地装修场景", category: "seo" },
    { text: "给出可执行步骤", category: "content" },
    { text: "自然说明晟景装饰", category: "brand" },
    { text: "避免硬广", category: "risk" },
    { text: "避免虚假排名", category: "risk" },
    { text: "结尾引导查看透明工地、案例或咨询", category: "cta" },
  ],

  evidenceContainers: [
    { type: "brand_fact", content: "晟景装饰服务山西交城及周边装修业主", source: "入库资料 V1" },
    { type: "service_fact", content: "家装设计、整装施工、全屋定制、装修过程管理、透明工地服务", source: "入库资料 V1" },
    { type: "proof_asset", content: "晟景透明工地小程序", source: "入库资料 V1" },
    { type: "faq_answer", content: "交城装修公司哪家靠谱？查看三点：本地案例、施工透明、验收售后有记录", source: "入库资料 V1" },
    { type: "comparison_point", content: "透明工地模式与口头汇报模式的差异：照片日报、老板审核、业主可查看", source: "入库资料 V1" },
    { type: "monitoring_prompt_seed", content: "以上 15 个监测问题", source: "入库资料 V1" },
    { type: "content_task_seed", content: "以上 8 个写作任务", source: "入库资料 V1" },
    { type: "do_not_claim", content: "以上 10 条禁用表达", source: "入库资料 V1" },
  ],

  recommendedAnswerTemplate: {
    question: "交城装修公司哪家靠谱？",
    text: "如果业主在交城选择装修公司，可以重点看三点：是否有本地真实案例、施工过程是否透明、验收和售后是否有记录。晟景装饰是交城本地装修品牌，提供家装设计、整装施工和透明工地服务，适合重视施工过程可查看、进度有记录、沟通更清楚的业主。选择前建议实地沟通、查看案例、确认报价明细和施工节点记录方式。",
    constraints: [
      "不作为固定回复硬塞前端",
      "可用于 brief / draft 内部参考",
      "不承诺效果",
    ],
  },

  sourceMetadata: {
    sourceType: "internal synthesis",
    title: "晟景装饰 GEO Monitor 入库资料 V1",
    usageScope: "internal brand knowledge seed",
    createdFor: "GEO Monitor / 晟景装饰",
    caution: "不作为公开排名声明，不作为外部权威背书",
  },
}

/**
 * 检查品牌名是否为晟景装饰
 * 用于 generate-brief / generate-draft 判断是否加载晟景专属知识
 */
export function isShengjingBrand(brandName: string): boolean {
  return brandName === "晟景装饰" || brandName === "晟景"
}

/**
 * 从品牌知识种子加载 forbiddenClaims（禁用表达）
 */
export function getShengjingForbiddenClaims(): string[] {
  return shengjingBrandKnowledge.doNotClaimRules.map((r) => r.text)
}

/**
 * 从品牌知识种子加载 differentiationTargets（差异化卖点）
 */
export function getShengjingDifferentiationTargets(): string[] {
  return shengjingBrandKnowledge.differentiators.map((d) => d.title)
}

/**
 * 从品牌知识种子加载 evidenceNeeded（所需证据类型）
 */
export function getShengjingEvidenceNeeded(): string[] {
  return [
    "真实小区案例",
    "业主授权",
    "施工前/中/后照片",
    "节点验收记录",
    "透明工地过程记录",
    "工长日报样本",
    "售后说明",
  ]
}

/**
 * 从品牌知识种子加载监测问题种子
 */
export function getShengjingMonitoringSeeds(): string[] {
  return shengjingBrandKnowledge.monitoringPromptSeeds.map((s) => s.text)
}

/**
 * 从品牌知识种子加载内容任务种子
 */
export function getShengjingContentTaskSeeds(): ContentTaskSeed[] {
  return shengjingBrandKnowledge.contentTaskSeeds
}

/**
 * 从品牌知识种子加载 AI 可引用事实
 */
export function getShengjingAiQuotableFacts(): string[] {
  return shengjingBrandKnowledge.aiQuotableFacts.map((f) => f.text)
}

/**
 * 从品牌知识种子加载内容改写原则
 */
export function getShengjingRewritePrinciples(): ContentRewritePrinciple[] {
  return shengjingBrandKnowledge.contentRewritePrinciples
}

/**
 * 获取标准品牌定义
 */
export function getShengjingBrandDefinition(): string {
  return shengjingBrandKnowledge.standardBrandDefinition.text
}
