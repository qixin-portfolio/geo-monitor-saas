"use client"

import { useMemo } from "react"

type TrendPoint = {
  id: string
  mentionRate: number
  createdAt: Date
}

export function TrendChart({ snapshots }: { snapshots: TrendPoint[] }) {
  const points = useMemo(() => {
    if (snapshots.length < 2) return []

    const maxRate = Math.max(...snapshots.map((s) => s.mentionRate), 100)
    const chartHeight = 120
    const chartWidth = 100 // percentage-based
    const gap = chartWidth / (snapshots.length - 1)

    return snapshots.map((snapshot, i) => ({
      x: i * gap,
      y: chartHeight - (snapshot.mentionRate / maxRate) * chartHeight,
      rate: snapshot.mentionRate,
      date: snapshot.createdAt,
      id: snapshot.id,
    }))
  }, [snapshots])

  if (points.length < 2) {
    return (
      <div className="flex h-[160px] items-center justify-center text-sm text-muted-foreground">
        至少需要 2 次监测数据才能展示趋势
      </div>
    )
  }

  // Build area fill path with proper SVG coordinates
  const areaPath =
    `M 0 120 L ${points.map((p) => `${p.x} ${p.y}`).join(" L ")} L 100 120 Z`
  const linePath = `M ${points.map((p) => `${p.x} ${p.y}`).join(" L ")}`

  return (
    <div className="flex flex-col gap-3">
      {/* Y-axis labels */}
      <div className="flex items-end gap-1">
        <span className="text-xs text-muted-foreground">推荐率趋势</span>
      </div>
      <div className="relative">
        <svg
          viewBox="0 0 100 120"
          className="h-[120px] w-full"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((pct) => (
            <line
              key={pct}
              x1={0}
              y1={120 - (pct / 100) * 120}
              x2={100}
              y2={120 - (pct / 100) * 120}
              stroke="currentColor"
              className="text-border"
              strokeWidth={0.3}
            />
          ))}
          {/* Area fill */}
          <path d={areaPath} fill="rgb(34 197 94 / 0.1)" />
          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="rgb(34 197 94)"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Data points */}
          {points.map((p) => (
            <circle
              key={p.id}
              cx={p.x}
              cy={p.y}
              r={1.5}
              fill="rgb(34 197 94)"
            />
          ))}
        </svg>
      </div>
      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {points[0].date.toLocaleDateString("zh-CN", {
            month: "short",
            day: "numeric",
          })}
        </span>
        <span>
          {points[points.length - 1].date.toLocaleDateString("zh-CN", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    </div>
  )
}
