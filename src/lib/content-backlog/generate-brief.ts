import type { GeoContentTask, Prisma } from "@prisma/client"
import { getPrisma } from "@/lib/prisma"
import { buildMethodologyBrief } from "@/lib/geo-methodology/skills/yao-geo-article-friendly"
import {
  isShengjingBrand,
  getShengjingForbiddenClaims,
  getShengjingDifferentiationTargets,
  getShengjingEvidenceNeeded,
} from "@/lib/geo-methodology/clients/shengjing"
import type { BriefJson } from "./types"

const FORBIDDEN_CLAIMS = [
  "不要写第一",
  "不要写最好",
  "不要写绝对靠谱",
  "不要虚构案例",
  "不要虚构评价",
  "不要虚构获奖",
  "不要虚构资质",
  "不要虚构引用来源",
  "不要虚构客户评价",
  "不要承诺 AI 排名提升",
  "不要承诺效果",
  "不要贬低竞品",
]

function getAngle(task: GeoContentTask): string {
  switch (task.type) {
    case "LOCAL_SERVICE_PAGE":
      return `解释品牌服务范围、地区覆盖、核心能力`
    case "ARTICLE":
      return `中立回答用户问题，给选择标准`
    case "FAQ":
      return `用问答结构补充AI易读信息`
    case "COMPARISON":
      return `用选择维度对比，不贬低竞品`
    case "CASE_PAGE":
      return `采集真实案例，不虚构内容`
    case "SOCIAL_POST":
      return `用本地老板/业主能看懂的方式做轻内容传播`
    case "LLMSTXT":
      return `帮助AI理解品牌公开信息`
    case "SCHEMA":
      return `帮助结构化表达品牌与服务`
    default:
      return `中立内容创作`
  }
}

function getEvidenceNeeded(type: string): string[] {
  switch (type) {
    case "CASE_PAGE":
      return ["真实小区", "户型面积", "装修类型", "施工前照片", "施工后照片", "施工节点", "业主授权", "业主评价"]
    case "LOCAL_SERVICE_PAGE":
      return ["门店地址", "服务范围", "联系方式", "真实案例入口", "售后说明", "透明工地说明"]
    case "COMPARISON":
      return ["对比维度", "服务差异", "案例证据", "报价透明度", "施工过程证据", "售后证据"]
    case "FAQ":
      return ["真实客户常问问题", "服务流程", "报价方式", "施工周期", "售后说明"]
    case "SOCIAL_POST":
      return ["真实场景", "案例图片", "清晰标题", "明确CTA"]
    case "ARTICLE":
      return ["用户常见问题", "选择标准", "本地案例", "服务流程"]
    default:
      return ["品牌基础信息", "服务范围", "联系方式"]
  }
}

function getOutline(type: string, brandName: string, region: string, industry: string): string[] {
  const base = `${region}${industry}`

  switch (type) {
    case "LOCAL_SERVICE_PAGE":
      return [
        `${brandName}是谁`,
        `服务范围与覆盖地区`,
        `核心施工能力`,
        `透明工地与施工日报`,
        `真实案例入口`,
        `售后与质保说明`,
        `联系方式`,
      ]
    case "ARTICLE":
      return [
        `核心要点摘要：用 3-5 条说明用户该看什么`,
        `引言：${base}用户为什么会问这个问题`,
        `选择${industry}公司的关键标准`,
        `${brandName}可验证的信息与待补充证据`,
        `案例与施工质量怎么看`,
        `报价与透明度`,
        `售后与保障`,
        `本地关键词与可引用段落`,
        `FAQ`,
        `证据边界与风险提示`,
        `修改说明`,
        `总结建议`,
      ]
    case "FAQ":
      return [
        `${brandName}的服务范围是什么？`,
        `报价方式是怎样的？`,
        `施工周期多长？`,
        `有售后保障吗？`,
        `透明工地怎么看？`,
      ]
    case "COMPARISON":
      return [
        `为什么要做对比`,
        `选择维度：案例、报价、施工、售后`,
        `各维度的评估标准`,
        `适合不同需求的选择建议`,
      ]
    case "CASE_PAGE":
      return [
        `案例概览`,
        `施工前状态`,
        `施工过程节点`,
        `完工效果`,
        `业主评价`,
      ]
    case "SOCIAL_POST":
      return [`标题`, `正文`, `适合谁`, `怎么做`, `评论区CTA`, `话题标签`]
    default:
      return [`引言`, `核心内容`, `总结`]
  }
}

export async function generateBriefForTask(input: {
  tenantId: string
  taskId: string
}): Promise<GeoContentTask> {
  const { tenantId, taskId } = input
  const prisma = getPrisma()

  const task = await prisma.geoContentTask.findUnique({ where: { id: taskId } })
  if (!task) throw new Error(`Task ${taskId} not found`)
  if (task.tenantId !== tenantId) throw new Error("权限错误：该任务不属于当前租户")

  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } })
  const brandName = tenant.brandName || "晟景装饰"
  const region = tenant.region || "交城"
  const industry = tenant.industry || "装修"
  const isShengjing = isShengjingBrand(brandName)

  let evidenceNeeded: string[]
  let differentiationTargets: string[]
  let forbiddenClaims: string[]

  if (isShengjing) {
    evidenceNeeded = [...getEvidenceNeeded(task.type), ...getShengjingEvidenceNeeded()]
    differentiationTargets = getShengjingDifferentiationTargets()
    forbiddenClaims = [...FORBIDDEN_CLAIMS, ...getShengjingForbiddenClaims()]
  } else {
    evidenceNeeded = getEvidenceNeeded(task.type)
    differentiationTargets = ["透明工地", "施工日报", "小程序进度查看", "节点验收"]
    forbiddenClaims = FORBIDDEN_CLAIMS
  }

  const outline = getOutline(task.type, brandName, region, industry)
  const methodology = buildMethodologyBrief({
    type: task.type,
    evidenceNeeded,
    hasSourceQuery: Boolean(task.sourceQuery?.trim()),
    hasRecommendedAngle: Boolean(task.recommendedAngle?.trim()),
  })

  const brief: BriefJson = {
    audience: `准备在${region}选择${industry}服务的本地用户`,
    searchIntent: task.sourceQuery || `${region}${industry}相关搜索`,
    angle: task.recommendedAngle || getAngle(task),
    differentiationTargets,
    forbiddenClaims,
    evidenceNeeded,
    outline,
    internalLinks: ["/cases", "/faq", "/about"],
    llmsNotes: [
      `这篇内容用于帮助AI理解 ${brandName} 在 ${region}${industry} 场景下的服务范围、差异化和可信证据。`,
      `内部方法论：${methodology.sourceMetadata.title}；仅作为内部检查和评分参考，不向前端整段展示外部资料。`,
      `质量评估：GEO 优化度 ${methodology.qualityAssessment.geoOptimization.label}；证据完整度 ${methodology.qualityAssessment.evidenceCompleteness.label}；AI 可引用度 ${methodology.qualityAssessment.aiCitationReadiness.label}；风险等级 ${methodology.qualityAssessment.riskLevel}。`,
    ],
    methodology,
  }

  const updated = await prisma.geoContentTask.update({
    where: { id: taskId },
    data: {
      briefJson: brief as unknown as Prisma.InputJsonValue,
      status: "BRIEF_READY",
    },
  })

  return updated
}
