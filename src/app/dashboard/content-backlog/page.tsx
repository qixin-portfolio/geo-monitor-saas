import Link from "next/link"
import { getPrisma } from "@/lib/prisma"
import { getOrCreateTenant } from "@/lib/tenant"
import {
  REPAIR_TASK_RISK_LABELS,
  REPAIR_TASK_TYPE_LABELS,
  buildRepairTaskWorkbenchViewModel,
  type RepairTaskRiskLevel,
} from "@/lib/content-backlog/repair-task-workbench"

export const dynamic = "force-dynamic"

const TYPE_LABELS: Record<string, string> = {
  ARTICLE: "文章",
  FAQ: "常见问题",
  CASE_PAGE: "案例页",
  COMPARISON: "对比分析",
  LOCAL_SERVICE_PAGE: "服务介绍",
  LLMSTXT: "LLMs.txt",
  SCHEMA: "结构化数据",
  SOCIAL_POST: "小红书笔记",
}

const STATUS_LABELS: Record<string, string> = {
  TODO: "待办",
  BRIEF_READY: "简报已就绪",
  DRAFT_READY: "草稿已就绪",
  REVIEW_NEEDED: "待审核",
  APPROVED: "已批准",
  EXPORTED: "已导出",
  SKIPPED: "已跳过",
}

const RISK_CLASS_NAMES: Record<RepairTaskRiskLevel, string> = {
  GREEN: "border-emerald-200 bg-emerald-50 text-emerald-700",
  YELLOW: "border-amber-200 bg-amber-50 text-amber-700",
  RED: "border-red-200 bg-red-50 text-red-700",
}

function getCompetitorsFromEvidence(value: unknown) {
  if (!value || typeof value !== "object") return []
  const evidence = value as { competitors?: unknown }
  if (!Array.isArray(evidence.competitors)) return []

  return evidence.competitors
    .map((item) => {
      if (typeof item === "string") return item
      if (item && typeof item === "object" && "name" in item) {
        const name = (item as { name?: unknown }).name
        return typeof name === "string" ? name : null
      }
      return null
    })
    .filter((item): item is string => Boolean(item?.trim()))
    .slice(0, 3)
}

export default async function ContentBacklogPage() {
  const tenant = await getOrCreateTenant()
  if (!tenant) {
    return (
      <div className="flex flex-col gap-6 p-6 md:p-8">
        <h1 className="text-3xl font-semibold">GEO 修复任务</h1>
        <p className="text-muted-foreground">请先登录。</p>
      </div>
    )
  }

  const prisma = getPrisma()
  const tasks = await prisma.geoContentTask.findMany({
    where: { tenantId: tenant.id },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  })

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">证据化修复工作台</h1>
          <p className="mt-2 text-muted-foreground">
            把已确认加入任务池的 RepairTask 整理成可追踪、可解释、可复测的修复行动。
          </p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-lg text-muted-foreground">暂无修复任务</p>
          <p className="mt-2 text-sm text-muted-foreground">
            在监测结果详情页点击「生成 GEO 修复任务」开始。
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-3 font-medium">优先级</th>
                <th className="px-4 py-3 font-medium">任务标题</th>
                <th className="px-4 py-3 font-medium">任务类型</th>
                <th className="px-4 py-3 font-medium">风险等级</th>
                <th className="px-4 py-3 font-medium">原因</th>
                <th className="px-4 py-3 font-medium">竞品</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">对应问题</th>
                <th className="px-4 py-3 font-medium">创建时间</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const competitors = getCompetitorsFromEvidence(task.evidenceJson)
                const workbench = buildRepairTaskWorkbenchViewModel(task)

                return (
                  <tr
                    key={task.id}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      {task.priority}
                    </td>
                    <td className="min-w-[260px] px-4 py-3">
                      <Link
                        href={`/dashboard/content-backlog/${task.id}`}
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        {task.title}
                      </Link>
                      {task.targetKeyword && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          目标词：{task.targetKeyword}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded bg-muted px-2 py-0.5 text-xs">
                        {REPAIR_TASK_TYPE_LABELS[workbench.type]}
                      </span>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {TYPE_LABELS[task.type] || task.type}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded border px-2 py-0.5 text-xs ${RISK_CLASS_NAMES[workbench.riskLevel]}`}
                      >
                        {REPAIR_TASK_RISK_LABELS[workbench.riskLevel]}
                      </span>
                    </td>
                    <td className="max-w-[280px] px-4 py-3 text-xs text-muted-foreground">
                      <span className="line-clamp-3">
                        {workbench.whyFix}
                      </span>
                    </td>
                    <td className="max-w-[220px] px-4 py-3">
                      {competitors.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {competitors.map((competitor) => (
                            <span
                              key={competitor}
                              className="rounded bg-muted px-2 py-0.5 text-xs"
                            >
                              {competitor}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded bg-muted px-2 py-0.5 text-xs">
                        {STATUS_LABELS[task.status] || task.status}
                      </span>
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-muted-foreground">
                      {workbench.evidenceSummary.relatedQuery}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(task.createdAt).toLocaleDateString("zh-CN")}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
