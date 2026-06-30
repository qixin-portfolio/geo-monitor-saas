export const DEFAULT_EVIDENCE_COMPETITORS = [
  "家装e站",
  "交换空间",
  "交城龙发",
  "美满家居",
  "新五环装饰",
]

export type EvidenceSourceType =
  | "business_registry"
  | "short_video"
  | "xiaohongshu"
  | "zhihu"
  | "wechat"
  | "official_site"
  | "local_listing"
  | "authority_media"
  | "unknown"

export type EvidenceGap =
  | "competitor_evidence_advantage"
  | "missing_citable_brand_evidence"
  | "weak_brand_definition"
  | "no_major_gap"

export type EvidencePriority = "P0" | "P1" | "P2"

export type EvidenceMapItem = {
  query: string
  brandMentioned: boolean
  competitorsMentioned: string[]
  sourceTypes: EvidenceSourceType[]
  evidenceGap: EvidenceGap
  suggestedAction: string
  suggestedPage: string
  priority: EvidencePriority
  confidence: number
  reason: string
}

export type ExtractEvidenceMapInput = {
  query: string
  answer?: string | null
  brandName?: string | null
  competitors?: string[] | null
}

const SOURCE_RULES: Array<{ type: EvidenceSourceType; keywords: string[] }> = [
  {
    type: "business_registry",
    keywords: ["爱企查", "企查查", "天眼查", "aiqicha", "aiqicha.baidu.com", "qcc", "qcc.com", "tianyancha", "tianyancha.com"],
  },
  { type: "short_video", keywords: ["抖音", "快手", "视频", "点赞", "douyin", "kuaishou"] },
  { type: "xiaohongshu", keywords: ["小红书", "xiaohongshu"] },
  { type: "zhihu", keywords: ["知乎", "zhihu"] },
  { type: "wechat", keywords: ["微信", "公众号", "weixin", "wechat", "mp.weixin.qq.com"] },
  { type: "official_site", keywords: ["官网", "官方网站", "网站", "official site"] },
  {
    type: "local_listing",
    keywords: ["大众点评", "高德", "百度地图", "地图", "本地列表", "本地服务列表", "门店", "amap", "amap.com", "dianping", "dianping.com", "map.baidu.com"],
  },
  { type: "authority_media", keywords: ["协会", "媒体", "权威媒体", "行业媒体", "新闻", "报道", "日报"] },
]

const QUALITY_SOURCE_TYPES: EvidenceSourceType[] = [
  "official_site",
  "local_listing",
  "authority_media",
]

function normalizeForMatch(value: string) {
  return value
    .toLowerCase()
    .replace(/[\s\u3000\-_/·,，。.;；:：、|()（）[\]【】"'“”‘’]+/g, "")
}

function normalizedIncludes(text: string, keyword: string) {
  const normalizedKeyword = normalizeForMatch(keyword)
  return normalizedKeyword ? normalizeForMatch(text).includes(normalizedKeyword) : false
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items))
}

export function inferEvidenceSourceTypes(text: string): EvidenceSourceType[] {
  const detected = SOURCE_RULES.filter((rule) =>
    rule.keywords.some((keyword) => normalizedIncludes(text, keyword))
  ).map((rule) => rule.type)

  return detected.length ? unique(detected) : ["unknown"]
}

function detectCompetitors(answer: string, competitors?: string[] | null) {
  const candidates =
    competitors && competitors.length > 0 ? competitors : DEFAULT_EVIDENCE_COMPETITORS

  return unique(
    candidates
      .map((name) => name.trim())
      .filter(Boolean)
      .filter((name) => normalizedIncludes(answer, name))
  )
}

function pickSuggestedPage(query: string) {
  if (/(哪家好|推荐|靠谱|口碑)/.test(query)) {
    return {
      page: "本地推荐页 / 案例页 / 客户评价页",
      action: "补充本地推荐理由、真实案例和客户评价，增强 AI 可引用的推荐证据。",
    }
  }

  if (/(工地|进度|透明|日报)/.test(query)) {
    return {
      page: "透明工地介绍页 / 工长日报页 / 工地案例页",
      action: "集中展示施工节点、工地日报、验收记录和过程照片。",
    }
  }

  if (/(环保|甲醛|板材)/.test(query)) {
    return {
      page: "环保材料说明页 / 材料验收页",
      action: "补充材料品牌、检测标准、验收流程和环保承诺。",
    }
  }

  if (/(增项|合同|售后|工期|投诉)/.test(query)) {
    return {
      page: "合同说明页 / 售后保障页 / 舆情防御 FAQ",
      action: "补充合同边界、增项规则、工期承诺、售后流程和常见质疑回应。",
    }
  }

  return {
    page: "品牌介绍页 / 本地服务页 / FAQ",
    action: "补充品牌定义、服务范围、案例证据和结构化问答。",
  }
}

function classifyGap({
  brandMentioned,
  competitorsMentioned,
  sourceTypes,
}: {
  brandMentioned: boolean
  competitorsMentioned: string[]
  sourceTypes: EvidenceSourceType[]
}): Pick<EvidenceMapItem, "evidenceGap" | "priority" | "confidence" | "reason"> {
  const hasQualitySource = sourceTypes.some((sourceType) =>
    QUALITY_SOURCE_TYPES.includes(sourceType)
  )

  if (!brandMentioned && competitorsMentioned.length > 0) {
    return {
      evidenceGap: "competitor_evidence_advantage",
      priority: "P0",
      confidence: 0.86,
      reason: `AI 没有提到本品牌，但提到了 ${competitorsMentioned.join("、")}，说明竞品证据更容易被引用。`,
    }
  }

  if (!brandMentioned && sourceTypes.length === 1 && sourceTypes[0] === "unknown") {
    return {
      evidenceGap: "missing_citable_brand_evidence",
      priority: "P0",
      confidence: 0.78,
      reason: "AI 没有提到本品牌，也没有明显可识别来源，优先补可引用的品牌证据。",
    }
  }

  if (
    brandMentioned &&
    sourceTypes.includes("business_registry") &&
    !hasQualitySource
  ) {
    return {
      evidenceGap: "weak_brand_definition",
      priority: "P1",
      confidence: 0.68,
      reason: "AI 能识别品牌，但证据更像工商信息，缺少官网、本地列表或权威媒体来定义品牌优势。",
    }
  }

  return {
    evidenceGap: "no_major_gap",
    priority: "P2",
    confidence: 0.55,
    reason: brandMentioned
      ? "AI 已提到品牌，本轮未识别到高优先级证据缺口。"
      : "AI 未提到品牌，但暂未识别到明确竞品或来源线索，需要继续积累答案样本。",
  }
}

export function extractEvidenceMap(input: ExtractEvidenceMapInput): EvidenceMapItem[] {
  const query = input.query.trim()
  const answer = input.answer?.trim() ?? ""
  const brandName = input.brandName?.trim() ?? ""
  const brandMentioned = brandName ? normalizedIncludes(answer, brandName) : false
  const competitorsMentioned = detectCompetitors(answer, input.competitors)
  const sourceTypes = inferEvidenceSourceTypes(answer)
  const suggestion = pickSuggestedPage(query)
  const gap = classifyGap({
    brandMentioned,
    competitorsMentioned,
    sourceTypes,
  })

  return [
    {
      query,
      brandMentioned,
      competitorsMentioned,
      sourceTypes,
      evidenceGap: gap.evidenceGap,
      suggestedAction: suggestion.action,
      suggestedPage: suggestion.page,
      priority: gap.priority,
      confidence: answer ? gap.confidence : Math.min(gap.confidence, 0.35),
      reason: answer ? gap.reason : "这条监测缺少 AI 回答文本，只能先标记为低可信度待补数据。",
    },
  ]
}

export function extractEvidenceMapItems(inputs: ExtractEvidenceMapInput[]) {
  return inputs.flatMap((input) => extractEvidenceMap(input))
}
