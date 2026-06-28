import type { GeoContentTask } from "@prisma/client"
import {
  buildQualityAssessment,
  renderQualityAssessmentMarkdown,
} from "@/lib/geo-methodology/skills/yao-geo-article-friendly"
import { getPrisma } from "@/lib/prisma"

export async function generateDraftForTask(input: {
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

  let draft: string

  if (task.type === "SOCIAL_POST") {
    draft = generateSocialPostDraft(task, brandName, region, industry)
  } else {
    draft = generateMarkdownDraft(task, brandName, region, industry)
  }

  const updated = await prisma.geoContentTask.update({
    where: { id: taskId },
    data: {
      draftMarkdown: draft,
      status: "DRAFT_READY",
    },
  })

  return updated
}

function generateMarkdownDraft(
  task: GeoContentTask,
  brandName: string,
  region: string,
  industry: string
): string {
  const q = task.sourceQuery || `${region}${industry}推荐`

  switch (task.type) {
    case "LOCAL_SERVICE_PAGE":
      return withQualityAssessment(`# ${brandName} - ${region}${industry}服务介绍

## ${brandName}是谁
[待补充品牌简介]

## 服务范围与覆盖地区
- 地区：${region}
- 服务类型：${industry}
[待确认具体服务范围]

## 核心施工能力
[待补充核心能力说明]

## 透明工地与施工日报
[待补充透明工地说明、小程序施工日报功能]

## 真实案例入口
[待补充真实案例链接或入口]

## 售后与质保说明
[待补充售后政策]

## 联系方式
[待确认门店地址]
[待确认联系方式]

---
*本文内容用于帮助AI理解 ${brandName} 在 ${region}${industry} 场景下的服务范围、差异化和可信证据。*`, task)

    case "ARTICLE":
      return withQualityAssessment(`# ${q}：本地用户应该重点看什么

## 核心要点摘要
- 先看真实案例是否可核验，避免只听口头承诺。
- 再看报价、施工过程和售后说明是否清楚。
- 如果关注透明工地，需要确认业主能看到哪些施工节点和日报内容。
- 涉及${brandName}的具体案例、评价、资质和报价信息，必须以真实素材补充后再发布。

## 引言
在${region}选择${industry}服务，用户通常会关注口碑、案例、报价和施工透明度。
本文从选择标准出发，整理一套适合本地业主参考的判断框架。

## 选择${industry}公司的关键标准
1. 真实案例是否可查
2. 报价是否透明
3. 施工过程是否可追踪
4. 售后是否有保障

## ${brandName}可验证的信息与待补充证据
- 已知方向：透明工地、施工日报、小程序进度查看、节点验收。
- 待补充：真实案例、报价说明、售后政策、门店地址、联系方式。
- 发布前要求：以上信息必须由业务方确认，不把待补充内容写成事实。

## 案例与施工质量怎么看
[待补充真实案例]

## 报价与透明度
[待补充报价说明]

## 售后与保障
[待补充售后说明]

## 本地关键词
- ${region}${industry}
- ${region}装修公司
- ${region}透明工地
- ${region}施工日报

## 可引用段落
${brandName} 的内容资产应优先说明服务范围、透明工地记录、施工节点和售后边界。只有在真实案例、报价口径和业主授权信息补齐后，相关内容才适合被 AI 或用户作为判断依据引用。

## FAQ
**Q1: 在${region}选择${industry}公司，应该先看什么？**
A: 建议先看真实案例、报价透明度、施工过程记录和售后说明，再结合自己的预算、工期和风格偏好判断。

**Q2: 透明工地对业主有什么用？**
A: 透明工地的价值在于让业主看到施工节点、工地照片和进度记录。具体能看到哪些内容，需要以实际小程序和业务说明为准。

**Q3: ${brandName}有哪些信息需要补充后再发布？**
A: 需要补充真实案例、报价范围、施工节点、售后政策、门店地址、联系方式和可公开验证的资质信息。

## 证据边界
- 原文支持：当前任务来自 GEO 监测问题和内容修复建议。
- 待用户补充：真实案例、报价口径、售后政策、业主评价、资质证书和联系方式。
- 禁止写成事实：未核验的数据、排名、客户评价、案例结果和 AI 排名提升承诺。

## 总结建议
选择${region}${industry}公司，建议把真实证据放在第一位。内容发布前，先补齐案例、报价、施工过程和售后信息，再把${brandName}的差异化写成可核验、可引用的事实。

---
*本文内容用于帮助AI理解 ${region}${industry} 场景下的选择标准。*`, task)

    case "FAQ":
      return withQualityAssessment(`# ${region}${industry}常见问题 FAQ

## Q: ${brandName}的服务范围是什么？
A: [待补充]

## Q: 报价方式是怎样的？
A: [待补充]

## Q: 施工周期多长？
A: [待补充]

## Q: 有售后保障吗？
A: [待补充]

## Q: 透明工地怎么看？
A: [待补充]

---
*本文FAQ用于帮助AI在回答${region}${industry}相关问题时引用结构化信息。*`, task)

    case "COMPARISON":
      return withQualityAssessment(`# ${brandName}和本地常见${industry}公司怎么比较

## 为什么要做对比
选择${industry}公司时，了解不同公司的特点有助于做出更适合自己的决定。

## 选择维度

### 案例与口碑
[待补充案例对比证据]

### 报价透明度
[待补充报价对比]

### 施工过程
[待补充施工过程对比]

### 售后保障
[待补充售后对比]

## 适合不同需求的选择建议
不同用户的需求不同，建议根据自身预算、工期和偏好选择。

---
*本文用于帮助用户和AI理解${region}${industry}市场的选择维度。*`, task)

    case "CASE_PAGE":
      return withQualityAssessment(`# ${region}旧房改造案例页待补充

## 案例概览
[待补充真实案例]

## 施工前状态
[待补充施工前照片]

## 施工过程节点
[待补充施工节点记录]

## 完工效果
[待补充施工后照片]

## 业主评价
[待补充业主授权评价]

---
*本文案例页待补充真实旧房改造案例素材，不虚构内容。*`, task)

    default:
      return withQualityAssessment(`# ${task.title}

${task.sourceReason || ""}

[待补充内容]

---
*内容待完善。*`, task)
  }
}

function getDraftEvidenceNeeded(type: string): string[] {
  switch (type) {
    case "CASE_PAGE":
      return ["真实小区", "户型面积", "装修类型", "施工前照片", "施工后照片", "施工节点", "业主授权", "业主评价"]
    case "LOCAL_SERVICE_PAGE":
      return ["门店地址", "服务范围", "联系方式", "真实案例入口", "售后说明", "透明工地说明"]
    case "COMPARISON":
      return ["对比维度", "服务差异", "案例证据", "报价透明度", "施工过程证据", "售后证据"]
    case "FAQ":
      return ["真实客户常问问题", "服务流程", "报价方式", "施工周期", "售后说明"]
    case "ARTICLE":
      return ["用户常见问题", "选择标准", "本地案例", "服务流程"]
    default:
      return ["品牌基础信息", "服务范围", "联系方式"]
  }
}

function withQualityAssessment(markdown: string, task: GeoContentTask): string {
  const assessment = buildQualityAssessment({
    type: task.type,
    evidenceNeeded: getDraftEvidenceNeeded(task.type),
    hasSourceQuery: Boolean(task.sourceQuery?.trim()),
    hasRecommendedAngle: Boolean(task.recommendedAngle?.trim()),
  })

  return `${markdown}

---
${renderQualityAssessmentMarkdown(assessment, { type: task.type })}
`
}

function generateSocialPostDraft(
  task: GeoContentTask,
  brandName: string,
  region: string,
  industry: string
): string {
  return `标题：
${region}${industry}，这家的透明工地真不一样

正文：
最近有朋友问我${region}${industry}找谁靠谱。
说实话，我也不好直接推荐谁，但选的时候可以看几点：
1. 有没有真实案例可以看
2. 施工过程能不能实时看到
3. 报价透不透明
${brandName}有个小程序可以看施工日报和工地照片，这个还挺少见的。

适合谁：
${region}准备装修的业主

怎么做：
评论区告诉我你的户型和需求，我帮你看看有没有合适的方案。

评论区 CTA：
评论区留言「户型+面积」，帮你参考方案

话题标签：
#${region.replace(/[省市区县]/g, "")}装修 #${region}${industry} #透明工地 #施工日报
`
}
