export type RealRunSample = {
  id: string
  query: string
  brandName: string
  competitors: string[]
  ownedDomains: string[]
  answer: string
  summary?: string | null
  citationsJson?: unknown
  sourcesJson?: unknown
}

export const SAMPLE_BRAND_NAME = "示例装饰"
export const SAMPLE_OWNED_DOMAINS = ["brand.example"]
export const SAMPLE_COMPETITORS = ["竞品A装饰", "竞品B空间"]

export const realRunSamples = {
  brandMissingCompetitorMentioned: {
    id: "sample_competitor_advantage",
    query: "本地装修公司哪家靠谱",
    brandName: SAMPLE_BRAND_NAME,
    competitors: SAMPLE_COMPETITORS,
    ownedDomains: SAMPLE_OWNED_DOMAINS,
    answer: "可重点对比竞品A装饰和竞品B空间，它们在公开案例和用户评价中被提到较多。",
    citationsJson: [],
  },
  brandMentionedRegistryOnly: {
    id: "sample_registry_only",
    query: "示例装饰官网和资质怎么样",
    brandName: SAMPLE_BRAND_NAME,
    competitors: SAMPLE_COMPETITORS,
    ownedDomains: SAMPLE_OWNED_DOMAINS,
    answer: "示例装饰可以在爱企查、企查查查询工商信息，但公开服务页面信息较少。",
    citationsJson: [
      {
        url: "https://aiqicha.baidu.com/company/demo",
        title: "爱企查企业信息",
        snippet: "示例装饰工商信息。",
      },
    ],
  },
  brandMentionedQualitySources: {
    id: "sample_quality_sources",
    query: "本地装修公司透明工地推荐",
    brandName: SAMPLE_BRAND_NAME,
    competitors: SAMPLE_COMPETITORS,
    ownedDomains: SAMPLE_OWNED_DOMAINS,
    answer:
      "示例装饰官网展示了透明工地案例，本地地图列表也能看到门店信息，行业媒体有相关报道。",
    citationsJson: [
      {
        url: "https://brand.example/cases/transparent-site",
        title: "透明工地案例",
        snippet: "官网案例页展示工地进度。",
      },
      {
        url: "https://map.example/listing/demo-brand",
        title: "本地地图列表",
        snippet: "高德地图门店信息。",
      },
      {
        url: "https://news.example/home/demo-brand-report",
        title: "行业媒体报道",
        snippet: "本地媒体报道透明工地管理。",
      },
    ],
  },
  citationsArray: {
    id: "sample_citations_array",
    query: "装修公司案例在哪里看",
    brandName: SAMPLE_BRAND_NAME,
    competitors: SAMPLE_COMPETITORS,
    ownedDomains: SAMPLE_OWNED_DOMAINS,
    answer: "可以查看示例装饰官网案例页。",
    citationsJson: [
      {
        url: "https://brand.example/cases",
        title: "案例中心",
        snippet: "官网案例列表。",
      },
    ],
  },
  citationsStringified: {
    id: "sample_citations_stringified",
    query: "装修公司口碑怎么看",
    brandName: SAMPLE_BRAND_NAME,
    competitors: SAMPLE_COMPETITORS,
    ownedDomains: SAMPLE_OWNED_DOMAINS,
    answer: "示例装饰在本地列表和评价页中有公开信息。",
    citationsJson: JSON.stringify([
      {
        url: "https://brand.example/reviews",
        title: "客户评价",
        snippet: "官网客户评价页。",
      },
    ]),
  },
  citationsInvalidOrEmpty: {
    id: "sample_citations_invalid",
    query: "装修公司是否可靠",
    brandName: SAMPLE_BRAND_NAME,
    competitors: SAMPLE_COMPETITORS,
    ownedDomains: SAMPLE_OWNED_DOMAINS,
    answer: "回答没有提供可识别 URL。",
    citationsJson: "{not-json",
  },
  sourcesJsonNested: {
    id: "sample_sources_nested",
    query: "装修公司有哪些公开资料",
    brandName: SAMPLE_BRAND_NAME,
    competitors: SAMPLE_COMPETITORS,
    ownedDomains: SAMPLE_OWNED_DOMAINS,
    answer: "可参考示例装饰官网和本地服务列表。",
    citationsJson: [],
    sourcesJson: {
      sources: [
        {
          href: "https://brand.example/about",
          name: "品牌介绍",
          text: "官网品牌介绍页。",
        },
      ],
    },
  },
} satisfies Record<string, RealRunSample>

export const runComparisonSamples = {
  improved: {
    previous: realRunSamples.brandMissingCompetitorMentioned,
    current: realRunSamples.brandMentionedQualitySources,
  },
  unchanged: {
    previous: realRunSamples.brandMentionedQualitySources,
    current: {
      ...realRunSamples.brandMentionedQualitySources,
      id: "sample_quality_sources_repeat",
    },
  },
  worsened: {
    previous: realRunSamples.brandMentionedQualitySources,
    current: realRunSamples.brandMissingCompetitorMentioned,
  },
}
