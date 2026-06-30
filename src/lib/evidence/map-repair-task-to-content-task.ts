import type { GeoContentTaskType, Prisma } from "@prisma/client"

import type { RepairTaskDraft, RepairTaskType } from "./map-evidence-gap-to-repair-task"

export type ContentBacklogTaskDraft = {
  title: string
  type: GeoContentTaskType
  priority: number
  sourceQuery: string
  sourceReason: string
  targetKeyword: string
  targetAudience: string
  recommendedAngle: string
  evidenceJson: Prisma.InputJsonObject
  briefJson: Prisma.InputJsonObject
}

const CONTENT_TYPE_BY_REPAIR_TYPE: Record<RepairTaskType, GeoContentTaskType> = {
  page_update: "LOCAL_SERVICE_PAGE",
  new_page: "LOCAL_SERVICE_PAGE",
  faq_addition: "FAQ",
  schema_fix: "SCHEMA",
  third_party_profile: "ARTICLE",
  review_collection: "CASE_PAGE",
  authority_building: "ARTICLE",
  sentiment_defense: "FAQ",
  competitor_counter: "COMPARISON",
}

function priorityToScore(priority: RepairTaskDraft["priority"]) {
  if (priority === "P0") return 90
  if (priority === "P1") return 70
  return 45
}

function buildSourceReason(task: RepairTaskDraft) {
  return [
    task.description,
    `证据缺口：${task.evidenceGap}。`,
    `建议页面：${task.suggestedPage}。`,
    `预期影响：${task.expectedImpact}`,
  ].join(" ")
}

function buildRecommendedAngle(task: RepairTaskDraft) {
  return [
    task.title,
    `围绕“${task.relatedQuery}”补齐可被 AI 引用的页面证据。`,
    `优先动作：${task.nextSteps.join(" / ")}`,
  ].join(" ")
}

export function mapRepairTaskToContentTask(task: RepairTaskDraft): ContentBacklogTaskDraft {
  const type = CONTENT_TYPE_BY_REPAIR_TYPE[task.taskType]
  const nextSteps = task.nextSteps.length ? task.nextSteps : ["补充可验证证据和 FAQ。"]

  return {
    title: task.title,
    type,
    priority: priorityToScore(task.priority),
    sourceQuery: task.relatedQuery,
    sourceReason: buildSourceReason(task),
    targetKeyword: task.relatedQuery,
    targetAudience: "负责官网、内容和 GEO 修复的运营/市场人员",
    recommendedAngle: buildRecommendedAngle(task),
    evidenceJson: {
      source: "evidence-map-repair-task",
      trigger: task.evidenceGap,
      repairTask: {
        taskType: task.taskType,
        priority: task.priority,
        evidenceGap: task.evidenceGap,
        suggestedPage: task.suggestedPage,
        expectedImpact: task.expectedImpact,
        effortLevel: task.effortLevel,
        nextSteps,
      },
      relatedQuery: task.relatedQuery,
      suggestedPage: task.suggestedPage,
      nextSteps,
    },
    briefJson: {
      audience: "负责官网、内容和 GEO 修复的运营/市场人员",
      searchIntent: task.relatedQuery,
      angle: task.title,
      differentiationTargets: [task.suggestedPage, task.evidenceGap, task.taskType],
      forbiddenClaims: [
        "不要伪造案例、评价、资质或第三方背书。",
        "不要承诺页面修改后 AI 答案会立即改变。",
      ],
      evidenceNeeded: [task.description, task.suggestedPage, task.expectedImpact],
      outline: nextSteps,
      internalLinks: [task.suggestedPage],
      llmsNotes: [
        "由 Evidence Map 的 RepairTask draft 映射而来。",
        "本轮只生成 Content Backlog draft，不写入数据库。",
      ],
    },
  }
}
