import { afterAll, beforeAll, describe, expect, it } from "vitest"

const DB_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
const describeIfDb = DB_URL ? describe : describe.skip


describeIfDb("runTenantBatch integration", () => {
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

  it("persists a failed query run and snapshot when provider config is missing", async () => {
    const { getPrisma } = prismaModule
    const { runTenantBatch } = await import("./run-tenant-batch")

    process.env.MONITORING_PROVIDER = "openai"
    process.env.MONITORING_MODEL = "gpt-4o-mini"
    delete process.env.OPENAI_API_KEY

    const prisma = getPrisma()
    const tenant = await prisma.tenant.create({
      data: {
        name: "Smoke Tenant",
        brandName: "Smoke Brand",
        industry: "装修",
        region: "交城",
      },
    })
    tenantIds.push(tenant.id)

    await prisma.query.create({
      data: {
        tenantId: tenant.id,
        text: "交城装修公司哪家靠谱？",
        platform: "manual",
        active: true,
      },
    })

    const result = await runTenantBatch({
      tenantId: tenant.id,
      triggerType: "MANUAL",
    })

    const batch = await prisma.runBatch.findFirstOrThrow({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
      include: {
        queryRuns: {
          include: {
            providerAttempts: true,
          },
        },
        snapshot: true,
      },
    })

    expect(result.status).toBe("failed")
    expect(batch.status).toBe("FAILED")
    expect(batch.queryRuns).toHaveLength(1)
    expect(batch.queryRuns[0]?.status).toBe("FAILED")
    expect(batch.queryRuns[0]?.errorMessage).toContain("OPENAI_API_KEY")
    expect(batch.queryRuns[0]?.providerAttempts).toHaveLength(1)
    expect(batch.queryRuns[0]?.providerAttempts[0]?.errorMessage).toContain("OPENAI_API_KEY")
    expect(batch.snapshot?.mentionRate).toBe(0)
  })

  it("finishes a pre-created batch when there are no active queries", async () => {
    const { getPrisma } = prismaModule
    const { runTenantBatch } = await import("./run-tenant-batch")

    const prisma = getPrisma()
    const tenant = await prisma.tenant.create({
      data: {
        name: "No Active Query Tenant",
        brandName: "Smoke Brand",
      },
    })
    tenantIds.push(tenant.id)

    const batch = await prisma.runBatch.create({
      data: {
        tenantId: tenant.id,
        triggerType: "MANUAL",
        status: "PENDING",
        startedAt: new Date(),
      },
    })

    const result = await runTenantBatch({
      tenantId: tenant.id,
      triggerType: "MANUAL",
      batchId: batch.id,
    })

    const updatedBatch = await prisma.runBatch.findUniqueOrThrow({
      where: { id: batch.id },
    })

    expect(result.status).toBe("skipped-no-active-queries")
    expect(updatedBatch.status).toBe("SUCCESS")
    expect(updatedBatch.queryCount).toBe(0)
    expect(updatedBatch.finishedAt).toBeTruthy()
  })

  it("fails leaked running query runs from failed batches", async () => {
    const { getPrisma } = prismaModule
    const { runTenantBatch } = await import("./run-tenant-batch")

    const prisma = getPrisma()
    const tenant = await prisma.tenant.create({
      data: {
        name: "Leaked QueryRun Tenant",
        brandName: "Smoke Brand",
      },
    })
    tenantIds.push(tenant.id)

    const query = await prisma.query.create({
      data: {
        tenantId: tenant.id,
        text: "交城装修公司哪家靠谱？",
        platform: "manual",
        active: false,
      },
    })
    const batch = await prisma.runBatch.create({
      data: {
        tenantId: tenant.id,
        triggerType: "MANUAL",
        status: "FAILED",
        startedAt: new Date(),
        finishedAt: new Date(),
        errorSummary: "previous failure",
      },
    })
    const leakedRun = await prisma.queryRun.create({
      data: {
        batchId: batch.id,
        queryId: query.id,
        provider: "ark",
        model: "doubao-seed-2-1-pro-260628",
        status: "RUNNING",
        prompt: query.text,
        startedAt: new Date(),
      },
    })

    const result = await runTenantBatch({
      tenantId: tenant.id,
      triggerType: "MANUAL",
    })

    const updatedRun = await prisma.queryRun.findUniqueOrThrow({
      where: { id: leakedRun.id },
    })

    expect(result.status).toBe("skipped-no-active-queries")
    expect(updatedRun.status).toBe("FAILED")
    expect(updatedRun.errorMessage).toContain("Parent batch failed")
    expect(updatedRun.finishedAt).toBeTruthy()
  })
})
