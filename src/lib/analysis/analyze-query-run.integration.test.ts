import { afterAll, beforeAll, describe, expect, it } from "vitest"

const DB_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
const describeIfDb = DB_URL ? describe : describe.skip


describeIfDb("analyzeQueryRun integration", () => {
  const tenantIds: string[] = []
  let prismaModule: typeof import("@/lib/prisma")

  beforeAll(async () => {
    process.env.DATABASE_URL = DB_URL!
    prismaModule = await import("@/lib/prisma")
  })

  afterAll(async () => {
    if (tenantIds.length === 0) return

    const prisma = prismaModule.getPrisma()
    await prisma.insightSnapshot.deleteMany({ where: { tenantId: { in: tenantIds } } })
    await prisma.queryRun.deleteMany({ where: { batch: { tenantId: { in: tenantIds } } } })
    await prisma.runBatch.deleteMany({ where: { tenantId: { in: tenantIds } } })
    await prisma.response.deleteMany({ where: { query: { tenantId: { in: tenantIds } } } })
    await prisma.query.deleteMany({ where: { tenantId: { in: tenantIds } } })
    await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } })
  })

  it("upserts analysis without creating duplicates", async () => {
    const { getPrisma } = prismaModule
    const { analyzeQueryRun } = await import("./analyze-query-run")
    const prisma = getPrisma()
    const tenant = await prisma.tenant.create({
      data: {
        name: "Analysis Tenant",
        brandName: "晟景装饰",
      },
    })
    tenantIds.push(tenant.id)
    const query = await prisma.query.create({
      data: {
        tenantId: tenant.id,
        text: "交城装修公司推荐",
      },
    })
    const batch = await prisma.runBatch.create({
      data: {
        tenantId: tenant.id,
        triggerType: "MANUAL",
        status: "SUCCESS",
      },
    })
    const run = await prisma.queryRun.create({
      data: {
        batchId: batch.id,
        queryId: query.id,
        provider: "test",
        model: "test-model",
        status: "SUCCESS",
        prompt: query.text,
        rawOutput: "1. 交城华浔品味装饰：口碑较好\n2. 晟景装饰：透明工地做得好",
      },
    })

    await analyzeQueryRun(run.id)
    await analyzeQueryRun(run.id)

    const count = await prisma.queryRunAnalysis.count({
      where: { queryRunId: run.id },
    })
    const updatedRun = await prisma.queryRun.findUniqueOrThrow({
      where: { id: run.id },
    })

    expect(count).toBe(1)
    expect(updatedRun.mentioned).toBe(true)
    expect(updatedRun.rank).toBe(2)
    expect(updatedRun.competitors).toEqual(["交城华浔品味装饰"])
  })
})
