import { afterAll, beforeAll, describe, expect, it } from "vitest"

describe("runTenantBatch integration", () => {
  let tenantId = ""
  let prismaModule: Awaited<ReturnType<typeof import("@/lib/prisma")>>

  beforeAll(async () => {
    process.env.DATABASE_URL =
      "postgresql://postgres:postgres@localhost:5432/geo_monitor?schema=public"

    prismaModule = await import("@/lib/prisma")
  })

  afterAll(async () => {
    if (!tenantId) return

    const prisma = prismaModule.getPrisma()
    await prisma.insightSnapshot.deleteMany({ where: { tenantId } })
    await prisma.queryRun.deleteMany({ where: { batch: { tenantId } } })
    await prisma.runBatch.deleteMany({ where: { tenantId } })
    await prisma.response.deleteMany({ where: { query: { tenantId } } })
    await prisma.query.deleteMany({ where: { tenantId } })
    await prisma.tenant.delete({ where: { id: tenantId } })
  })

  it("persists a failed query run and snapshot when provider config is missing", async () => {
    const { getPrisma } = prismaModule
    const { runTenantBatch } = await import("./run-tenant-batch")

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
    tenantId = tenant.id

    await prisma.query.create({
      data: {
        tenantId,
        text: "交城装修公司哪家靠谱？",
        platform: "manual",
        active: true,
      },
    })

    const result = await runTenantBatch({
      tenantId,
      triggerType: "MANUAL",
    })

    const batch = await prisma.runBatch.findFirstOrThrow({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      include: {
        queryRuns: true,
        snapshot: true,
      },
    })

    expect(result.status).toBe("failed")
    expect(batch.status).toBe("FAILED")
    expect(batch.queryRuns).toHaveLength(1)
    expect(batch.queryRuns[0]?.status).toBe("FAILED")
    expect(batch.queryRuns[0]?.errorMessage).toContain("OPENAI_API_KEY")
    expect(batch.snapshot?.mentionRate).toBe(0)
  })
})
