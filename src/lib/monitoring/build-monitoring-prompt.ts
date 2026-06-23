type MonitoringPromptInput = {
  brandName: string
  industry: string | null
  region: string | null
  queryText: string
}

export function buildMonitoringPrompt({
  brandName,
  industry,
  region,
  queryText,
}: MonitoringPromptInput) {
  const context = [
    `品牌：${brandName}`,
    industry ? `行业：${industry}` : null,
    region ? `地区：${region}` : null,
  ]
    .filter(Boolean)
    .join("\n")

  return [
    "你是一个本地推荐场景分析助手。",
    context,
    `用户问题：${queryText}`,
    "请列出推荐名单，并说明每个推荐对象的理由。",
    "如果适合排序，请给出明确顺序。",
  ].join("\n\n")
}
