import type { GeoContentTaskType } from "@prisma/client"

type ScoreDimension = {
  dimension: string
  weight: number
  check: string
}

type QualityMetric = {
  score: number
  label: string
  basis: string
}

export type GeoMethodologyQualityAssessment = {
  geoOptimization: QualityMetric
  evidenceCompleteness: QualityMetric
  aiCitationReadiness: QualityMetric
  riskLevel: "LOW" | "MEDIUM" | "HIGH"
  riskNotes: string[]
  supplementRequests: string[]
}

export const sourceMetadata = {
  skillId: "yao-geo-article-friendly",
  title: "Yao GEO Article Friendly",
  author: "Yao Team",
  maintainer: "Yao Team",
  sourceName: "yao-geo-skills",
  sourceUrl:
    "https://github.com/yaojingang/yao-geo-skills/tree/main/skills/yao-geo-article-friendly",
  license: "MIT License (Copyright (c) 2026 Yao)",
  retrievedAt: "2026-06-28",
  usageScope: "internal methodology reference",
} as const

export const articleStructureChecklist = [
  "H1 标题直接回答用户搜索意图",
  "开头提供 3-5 条核心摘要",
  "正文使用清晰的 H2/H3 分层标题",
  "对流程类内容使用步骤，对对比类内容谨慎使用表格",
  "结论复述已有证据能支持的真实答案",
  "FAQ 只回答当前内容或已核验证据能支撑的问题",
  "末尾标注内容更新时间和证据边界",
]

export const evidenceBoundaryRules = [
  "原文或现有业务信息已支持的内容，可作为事实表达",
  "外部核验过的内容必须保留来源、时间、口径或链接",
  "缺少来源的数据、案例、客户评价、资质和引用，只能标为待补充",
  "统计数据缺少样本、时间、地区或方法时，必须提示补充数据口径",
  "不得编造研究、排名、百分比、客户评价、案例、专家引语或机构背书",
]

export const geoScoreRubric: ScoreDimension[] = [
  { dimension: "权威原文引语", weight: 16, check: "是否有可追溯的直接引用或明确证据片段" },
  { dimension: "统计数据完整性", weight: 14, check: "是否说明样本、时间、地区、方法和数据来源" },
  { dimension: "可引用性/可信来源", weight: 13, check: "是否形成 AI 可直接摘取的事实段落" },
  { dimension: "结构规范性", weight: 12, check: "是否包含摘要、层级标题、步骤/FAQ/结论" },
  { dimension: "表达流畅度", weight: 10, check: "段落是否短、清楚、逻辑过渡自然" },
  { dimension: "语义密度", weight: 8, check: "是否覆盖实体、问题、场景和关键术语" },
  { dimension: "权威信号", weight: 8, check: "是否说明作者、品牌、方法、限制和更新时间" },
  { dimension: "专业术语", weight: 6, check: "术语是否准确、统一，并在首次出现时解释" },
  { dimension: "鲁棒性/多源支撑", weight: 5, check: "是否标注适用边界、反例和证据不足处" },
  { dimension: "跨域连接", weight: 4, check: "是否在主题支持时连接相邻场景" },
  { dimension: "易懂表达", weight: 3, check: "是否用用户能理解的表达解释专业内容" },
]

export const semanticDensityRules = [
  "优先补齐品牌、地区、服务、人群、场景、流程、案例、售后等实体",
  "同一概念保持统一命名，不堆叠近义关键词",
  "每个段落尽量承载一个明确问题或事实点",
  "本地服务内容必须自然包含地区词、服务词和用户真实问法",
  "重要术语首次出现时给一句可读解释",
]

export const aiCitationReadinessChecklist = [
  "存在 1-3 句可被 AI 直接引用的短段落",
  "关键结论有明确证据来源或待补充标记",
  "FAQ 答案短、明确、独立可读",
  "品牌优势和适用场景分开写，避免混成宣传口号",
  "内容不承诺 AI 排名提升或搜索结果改善",
]

export const riskControlRules = [
  "不承诺 AI 排名提升",
  "不编造数据、案例、客户评价、资质或引用来源",
  "不使用第一、最好、绝对靠谱等无法证明的绝对化表达",
  "不做恶意竞品攻击，对比内容只写可验证维度",
  "不确定信息明确写成待补充或待确认",
  "对施工、报价、售后等敏感承诺保留业务确认边界",
]

export const supplementRequestRules = [
  "缺案例时，请补充真实小区、户型面积、施工节点、图片和授权状态",
  "缺报价时，请补充报价方式、包含项目、不包含项目和适用范围",
  "缺售后时，请补充质保周期、响应方式和例外情况",
  "缺透明工地信息时，请补充小程序截图、施工日报字段和节点验收流程",
  "缺资质或荣誉时，请补充可公开验证的证书名称、编号或链接",
]

export const changeNotesTemplate = {
  structure: "结构层面：补摘要、层级标题、FAQ 和结论，方便用户和 AI 快速理解。",
  evidence: "证据层面：把缺少来源的事实标为待补充，不把未确认内容写成事实。",
  expression: "表达层面：缩短段落，减少口号化表达，增加可直接引用的句子。",
  semantics: "语义层面：补齐地区、服务、流程、案例、售后和透明工地等本地实体。",
  comparison:
    "对比层面：只保留中立对比维度、证据边界和风险提示，不套用完整文章改造结构。",
  checklist:
    "检查层面：复用证据边界、语义密度、AI 可引用度和风险控制规则，不强行改成文章模板。",
}

export function getMethodologyScope(type: GeoContentTaskType) {
  if (type === "ARTICLE") {
    return {
      appliesArticleStructure: true,
      appliedRules: [
        "articleStructureChecklist",
        "evidenceBoundaryRules",
        "geoScoreRubric",
        "semanticDensityRules",
        "aiCitationReadinessChecklist",
        "riskControlRules",
        "supplementRequestRules",
        "changeNotesTemplate",
      ],
    }
  }

  if (type === "COMPARISON") {
    return {
      appliesArticleStructure: false,
      appliedRules: [
        "evidenceBoundaryRules",
        "aiCitationReadinessChecklist",
        "riskControlRules",
      ],
    }
  }

  if (type === "FAQ" || type === "CASE_PAGE" || type === "LOCAL_SERVICE_PAGE") {
    return {
      appliesArticleStructure: false,
      appliedRules: [
        "evidenceBoundaryRules",
        "geoScoreRubric",
        "semanticDensityRules",
        "aiCitationReadinessChecklist",
        "riskControlRules",
        "supplementRequestRules",
      ],
    }
  }

  return {
    appliesArticleStructure: false,
    appliedRules: ["evidenceBoundaryRules", "riskControlRules"],
  }
}

export function buildQualityAssessment(input: {
  type: GeoContentTaskType
  evidenceNeeded: string[]
  hasSourceQuery: boolean
  hasRecommendedAngle: boolean
}): GeoMethodologyQualityAssessment {
  const scope = getMethodologyScope(input.type)
  const needsFullArticle = input.type === "ARTICLE"
  const baseGeoScore = needsFullArticle ? 72 : input.type === "COMPARISON" ? 58 : 64
  const evidenceScore = Math.max(36, 72 - input.evidenceNeeded.length * 4)
  const citationScore = scope.appliedRules.includes("aiCitationReadinessChecklist") ? 66 : 50
  const riskLevel =
    input.evidenceNeeded.length >= 7 || input.type === "CASE_PAGE" ? "HIGH" : "MEDIUM"

  const supplementRequests = uniqueStrings([
    ...input.evidenceNeeded.map((item) => `请补充或确认：${item}`),
    input.hasSourceQuery ? "" : "请补充真实搜索问题或用户提问",
    input.hasRecommendedAngle ? "" : "请确认内容切入角度是否符合业务口径",
  ])

  return {
    geoOptimization: {
      score: baseGeoScore,
      label: `${baseGeoScore}/100`,
      basis: needsFullArticle
        ? "已启用摘要、分层标题、FAQ、证据边界、本地关键词、可引用段落和修改说明。"
        : "已启用 GEO 检查规则和质量评分，但未套用完整文章结构。",
    },
    evidenceCompleteness: {
      score: evidenceScore,
      label: `${evidenceScore}/100`,
      basis:
        input.evidenceNeeded.length > 0
          ? "仍有素材待补充，未确认信息不得写成事实。"
          : "当前任务没有列出明显证据缺口。",
    },
    aiCitationReadiness: {
      score: citationScore,
      label: `${citationScore}/100`,
      basis:
        citationScore >= 60
          ? "生成内容会保留短段落、FAQ 或事实清单，便于 AI 摘取。"
          : "当前类型只做基础风险约束，不强化引用结构。",
    },
    riskLevel,
    riskNotes: [
      "不承诺 AI 排名提升。",
      "未确认的案例、评价、报价、资质、数据和引用必须保留待补充标记。",
      "竞品相关内容只做中立维度说明，不做攻击性判断。",
    ],
    supplementRequests,
  }
}

export function buildMethodologyBrief(input: {
  type: GeoContentTaskType
  evidenceNeeded: string[]
  hasSourceQuery: boolean
  hasRecommendedAngle: boolean
}) {
  const scope = getMethodologyScope(input.type)

  return {
    sourceMetadata,
    scope,
    articleStructureChecklist: scope.appliesArticleStructure ? articleStructureChecklist : [],
    evidenceBoundaryRules,
    geoScoreRubric:
      input.type === "COMPARISON" ? geoScoreRubric.filter((item) => item.weight >= 13) : geoScoreRubric,
    semanticDensityRules:
      input.type === "COMPARISON" ? [] : semanticDensityRules,
    aiCitationReadinessChecklist,
    riskControlRules,
    supplementRequestRules,
    changeNotesTemplate,
    qualityAssessment: buildQualityAssessment(input),
  }
}

export function renderQualityAssessmentMarkdown(
  assessment: GeoMethodologyQualityAssessment,
  options: { type?: GeoContentTaskType } = {}
) {
  const changeNotes = getChangeNotesForTaskType(options.type)

  return `## 内部 GEO 质量评估

- GEO 优化度：${assessment.geoOptimization.label}。${assessment.geoOptimization.basis}
- 证据完整度：${assessment.evidenceCompleteness.label}。${assessment.evidenceCompleteness.basis}
- AI 可引用度：${assessment.aiCitationReadiness.label}。${assessment.aiCitationReadiness.basis}
- 风险等级：${assessment.riskLevel}

## 需要用户补充的信息
${assessment.supplementRequests.map((item) => `- ${item}`).join("\n")}

## 风险提示
${assessment.riskNotes.map((item) => `- ${item}`).join("\n")}

## 修改说明
${changeNotes.map((item) => `- ${item}`).join("\n")}`
}

function getChangeNotesForTaskType(type?: GeoContentTaskType) {
  if (type === "ARTICLE") {
    return [
      changeNotesTemplate.structure,
      changeNotesTemplate.evidence,
      changeNotesTemplate.expression,
      changeNotesTemplate.semantics,
    ]
  }

  if (type === "COMPARISON") {
    return [
      changeNotesTemplate.comparison,
      changeNotesTemplate.evidence,
      "引用层面：保留可核验事实和待补充项，不输出竞品攻击或无法证明的判断。",
    ]
  }

  if (type === "FAQ" || type === "CASE_PAGE" || type === "LOCAL_SERVICE_PAGE") {
    return [
      changeNotesTemplate.checklist,
      changeNotesTemplate.evidence,
      changeNotesTemplate.semantics,
    ]
  }

  return [changeNotesTemplate.evidence]
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}
