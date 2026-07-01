import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ContentBacklogTaskDraft } from "@/lib/evidence/map-repair-task-to-content-task"

const getOrCreateTenantMock = vi.hoisted(() => vi.fn())
const prismaMock = vi.hoisted(() => ({
  query: {
    findFirst: vi.fn(),
  },
  queryRun: {
    findFirst: vi.fn(),
  },
  queryRunAnalysis: {
    findFirst: vi.fn(),
  },
  geoContentTask: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
}))

vi.mock("@/lib/tenant", () => ({
  getOrCreateTenant: getOrCreateTenantMock,
}))

vi.mock("@/lib/prisma", () => ({
  getPrisma: () => prismaMock,
}))

import { createEvidenceRepairTask } from "./create-evidence-repair-task"

function draft(overrides: Partial<ContentBacklogTaskDraft> = {}): ContentBacklogTaskDraft {
  return {
    title: "新增可被 AI 引用的品牌证据页",
    type: "LOCAL_SERVICE_PAGE",
    priority: 90,
    sourceQuery: "交城装修公司推荐",
    sourceReason: "AI 没有找到清晰品牌证据，需要补充本地服务页和 FAQ。",
    targetKeyword: "交城装修公司推荐",
    targetAudience: "负责官网、内容和 GEO 修复的运营/市场人员",
    recommendedAngle: "围绕本地推荐问题补齐可引用页面证据。",
    evidenceJson: {
      source: "evidence-map-repair-task",
      trigger: "missing_citable_brand_evidence",
      relatedQuery: "交城装修公司推荐",
      suggestedPage: "品牌介绍页 / 本地服务页 / FAQ",
      nextSteps: ["补充真实案例。", "增加 FAQ。"],
      repairTask: {
        taskType: "new_page",
        priority: "P0",
        evidenceGap: "missing_citable_brand_evidence",
        suggestedPage: "品牌介绍页 / 本地服务页 / FAQ",
        expectedImpact: "为后续 AI 答案提供稳定引用入口。",
        effortLevel: "M",
        nextSteps: ["补充真实案例。", "增加 FAQ。"],
      },
    },
    briefJson: {
      audience: "负责官网、内容和 GEO 修复的运营/市场人员",
      searchIntent: "交城装修公司推荐",
      angle: "新增可被 AI 引用的品牌证据页",
      differentiationTargets: ["品牌介绍页", "FAQ"],
      forbiddenClaims: ["不要承诺页面修改后 AI 答案会立即改变。"],
      evidenceNeeded: ["真实案例", "服务范围"],
      outline: ["补充真实案例。", "增加 FAQ。"],
      internalLinks: ["品牌介绍页 / 本地服务页 / FAQ"],
      llmsNotes: ["由 Evidence Map 的 RepairTask draft 映射而来。"],
    },
    ...overrides,
  }
}

function ownedQuery() {
  return { id: "query_1", text: "交城装修公司推荐" }
}

function ownedRun() {
  return {
    id: "run_1",
    queryId: "query_1",
    provider: "ark",
    model: "doubao-seed-2-1-pro-260628",
    query: ownedQuery(),
    analysis: { id: "analysis_1" },
  }
}

describe("createEvidenceRepairTask", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getOrCreateTenantMock.mockResolvedValue({ id: "tenant_1" })
    prismaMock.query.findFirst.mockResolvedValue(null)
    prismaMock.queryRun.findFirst.mockResolvedValue(null)
    prismaMock.queryRunAnalysis.findFirst.mockResolvedValue(null)
    prismaMock.geoContentTask.findMany.mockResolvedValue([])
    prismaMock.geoContentTask.create.mockResolvedValue({ id: "task_1" })
  })

  it("rejects unauthenticated requests", async () => {
    getOrCreateTenantMock.mockResolvedValueOnce(null)

    const result = await createEvidenceRepairTask({ draft: draft() })

    expect(result.success).toBe(false)
    expect(result.errors).toContain("未登录或无法确认当前租户")
    expect(prismaMock.geoContentTask.create).not.toHaveBeenCalled()
  })

  it("rejects invalid drafts before touching the database", async () => {
    const result = await createEvidenceRepairTask({
      draft: draft({ priority: 50 }),
    })

    expect(result.success).toBe(false)
    expect(result.errors).toContain("invalid priority：priority 不在白名单内")
    expect(prismaMock.query.findFirst).not.toHaveBeenCalled()
    expect(prismaMock.geoContentTask.create).not.toHaveBeenCalled()
  })

  it("rejects raw response fields before creating a task", async () => {
    const result = await createEvidenceRepairTask({
      draft: {
        ...draft(),
        evidenceJson: {
          ...draft().evidenceJson,
          rawResponse: { answer: "full raw answer" },
        },
      },
    })

    expect(result.success).toBe(false)
    expect(result.errors.join(" ")).toContain("raw response")
    expect(prismaMock.geoContentTask.create).not.toHaveBeenCalled()
  })

  it("rejects cross-tenant query references", async () => {
    prismaMock.query.findFirst.mockResolvedValueOnce(null)

    const result = await createEvidenceRepairTask({
      draft: draft(),
      queryId: "query_other",
    })

    expect(result.success).toBe(false)
    expect(result.errors).toContain("query 不存在或不属于当前租户")
    expect(prismaMock.query.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "query_other", tenantId: "tenant_1" },
      })
    )
    expect(prismaMock.geoContentTask.create).not.toHaveBeenCalled()
  })

  it("rejects cross-tenant query run references", async () => {
    prismaMock.query.findFirst.mockResolvedValueOnce(ownedQuery())
    prismaMock.queryRun.findFirst.mockResolvedValueOnce(null)

    const result = await createEvidenceRepairTask({
      draft: draft(),
      queryId: "query_1",
      queryRunId: "run_other",
    })

    expect(result.success).toBe(false)
    expect(result.errors).toContain("queryRun 不存在或不属于当前租户")
    expect(prismaMock.queryRun.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "run_other",
          query: { tenantId: "tenant_1" },
          batch: { tenantId: "tenant_1" },
        }),
      })
    )
    expect(prismaMock.geoContentTask.create).not.toHaveBeenCalled()
  })

  it("creates a single task with sanitized draft and server-owned tenant context", async () => {
    prismaMock.query.findFirst.mockResolvedValueOnce(ownedQuery())
    prismaMock.queryRun.findFirst.mockResolvedValueOnce(ownedRun())
    prismaMock.geoContentTask.findMany.mockResolvedValueOnce([])
    prismaMock.geoContentTask.create.mockResolvedValueOnce({ id: "task_1" })

    const result = await createEvidenceRepairTask({
      draft: {
        ...draft(),
        tenantId: "tenant_other",
        arbitrary: "drop me",
      },
      queryId: "query_1",
      queryRunId: "run_1",
    })

    const createArg = prismaMock.geoContentTask.create.mock.calls[0][0]

    expect(result).toEqual({
      success: true,
      taskId: "task_1",
      duplicate: false,
      errors: [],
    })
    expect(createArg.data.tenantId).toBe("tenant_1")
    expect(createArg.data.queryRunId).toBe("run_1")
    expect(createArg.data.analysisId).toBe("analysis_1")
    expect(createArg.data.sourceProvider).toBe("ark")
    expect(createArg.data.sourceModel).toBe("doubao-seed-2-1-pro-260628")
    expect(createArg.data.sourceQuery).toBe("交城装修公司推荐")
    expect(createArg.data.evidenceJson).not.toHaveProperty("tenantId")
    expect(createArg.data.evidenceJson).not.toHaveProperty("arbitrary")
  })

  it("returns duplicate when the same tenant already has the same repair task", async () => {
    prismaMock.query.findFirst.mockResolvedValueOnce(ownedQuery())
    prismaMock.geoContentTask.findMany.mockResolvedValueOnce([
      {
        id: "task_existing",
        title: "已有任务",
        type: "LOCAL_SERVICE_PAGE",
        sourceQuery: "交城装修公司推荐",
        evidenceJson: draft().evidenceJson,
      },
    ])

    const result = await createEvidenceRepairTask({
      draft: draft(),
      queryId: "query_1",
    })

    expect(result).toEqual({
      success: true,
      taskId: "task_existing",
      duplicate: true,
      errors: [],
    })
    expect(prismaMock.geoContentTask.create).not.toHaveBeenCalled()
  })
})
