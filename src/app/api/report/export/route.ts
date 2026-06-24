import { NextResponse } from "next/server"

import { getMonitoringDashboardData } from "@/lib/monitoring/read-models"

export async function GET() {
  try {
    const data = await getMonitoringDashboardData()

    const lines: string[] = []
    lines.push("# GEO Monitor 监测报告")
    lines.push(`生成时间：${new Date().toLocaleString("zh-CN", { hour12: false })}`)
    lines.push(`品牌：${data.tenant.brandName ?? "未设置"}`)
    lines.push(`行业：${data.tenant.industry ?? "未设置"}`)
    lines.push(`套餐：${data.tenant.plan}`)
    lines.push("")
    lines.push("## 核心指标")
    lines.push(`- 关键词数量：${data.queryCount}`)
    lines.push(`- 最近一轮监测数：${data.responseCount}`)
    lines.push(`- 品牌被提及：${data.mentionedCount}`)
    lines.push(`- AI 推荐率：${data.recommendationRate}%`)
    if (data.averageRank) {
      lines.push(`- 平均排名：${data.averageRank}`)
    }
    lines.push(`- 最近运行状态：${data.lastRunStatus}`)
    lines.push(`- 最近运行时间：${data.lastRunLabel}`)
    lines.push("")

    if (data.anomalyFlags.length > 0) {
      lines.push("## 异常提醒")
      data.anomalyFlags.forEach((flag) => lines.push(`- ${flag}`))
      lines.push("")
    }

    if (data.competitors.length > 0) {
      lines.push("## 竞品列表")
      data.competitors.forEach((c) => lines.push(`- ${c}`))
      lines.push("")
    }

    if (data.recentQueries.length > 0) {
      lines.push("## 关键词监测结果")
      lines.push("| 关键词 | 最近状态 | 排名 |")
      lines.push("|--------|----------|------|")
      data.recentQueries.forEach((q) => {
        const status = q.latestRun
          ? q.latestRun.mentioned
            ? "提到品牌"
            : "未提到品牌"
          : q.latestResponse?.mentioned
            ? "手动-提到品牌"
            : "暂无结果"
        const rank = q.latestRun?.rank ? String(q.latestRun.rank) : "-"
        lines.push(`| ${q.text} | ${status} | ${rank} |`)
      })
      lines.push("")
    }

    if (data.recentSnapshots.length > 0) {
      lines.push("## 历史趋势")
      lines.push("| 时间 | 推荐率 | 趋势 | 异常 |")
      lines.push("|------|--------|------|------|")
      data.recentSnapshots.forEach((s) => {
        const date = new Date(s.createdAt).toLocaleString("zh-CN", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
        const flags = s.anomalyFlags.length > 0 ? s.anomalyFlags.join("; ") : "-"
        lines.push(`| ${date} | ${s.mentionRate}% | ${s.trendDirection} | ${flags} |`)
      })
      lines.push("")
    }

    lines.push("---")
    lines.push("由 GEO Monitor 自动生成")

    const markdown = lines.join("\n")

    return new NextResponse(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="geo-monitor-report-${new Date().toISOString().slice(0, 10)}.md"`,
      },
    })
  } catch {
    return NextResponse.json({ error: "生成报告失败" }, { status: 500 })
  }
}
