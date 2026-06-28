import { readFile } from "node:fs/promises"
import path from "node:path"

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { config } from "dotenv"

import { identifyQueryIntentType } from "../src/lib/monitoring/geo-intent"

config({ path: ".env.local" })
config()

const SOURCE = "geo-content-center-seed"
const DEV_USER_ID = "dev-user-local"

type GeoSeed = {
  brandName: string
  industry: string
  region: string
  siteUrl?: string
  queries: string[]
  brandAliases: string[]
  negativeKeywords: string[]
  pages: Array<{ type: string; path: string }>
}

function getDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured")
  }
  return process.env.DATABASE_URL
}

function formatError(error: unknown) {
  if (!(error instanceof Error)) return String(error)

  const detail = error as Error & {
    code?: string
    clientVersion?: string
    meta?: unknown
    cause?: unknown
  }

  return JSON.stringify(
    {
      name: error.name,
      message: error.message,
      code: detail.code,
      clientVersion: detail.clientVersion,
      meta: detail.meta,
      cause:
        detail.cause instanceof Error
          ? { name: detail.cause.name, message: detail.cause.message }
          : detail.cause,
    },
    null,
    2
  )
}

function parseArgs(): {
  file: string
  email: string
  replace: boolean
  dryRun: boolean
} {
  const args = process.argv.slice(2)
  const result: {
    file?: string
    email?: string
    replace: boolean
    dryRun: boolean
  } = { replace: false, dryRun: false }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === "--replace") {
      result.replace = true
      continue
    }
    if (arg === "--dry-run") {
      result.dryRun = true
      continue
    }
    if (arg === "--file") result.file = args[index + 1]
    if (arg === "--email") result.email = args[index + 1]
  }

  if (!result.file) throw new Error("--file is required")
  if (!result.email) throw new Error("--email is required")
  return {
    file: result.file,
    email: result.email,
    replace: result.replace,
    dryRun: result.dryRun,
  }
}

function assertString(value: unknown, field: string): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Invalid seed field: ${field}`)
  }
}

function assertStringArray(value: unknown, field: string): asserts value is string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`Invalid seed field: ${field}`)
  }
}

function assertPages(value: unknown): asserts value is GeoSeed["pages"] {
  if (
    !Array.isArray(value) ||
    value.some(
      (item) =>
        typeof item !== "object" ||
        item === null ||
        typeof (item as { type?: unknown }).type !== "string" ||
        typeof (item as { path?: unknown }).path !== "string"
    )
  ) {
    throw new Error("Invalid seed field: pages")
  }
}

async function readSeed(file: string) {
  const json = JSON.parse(await readFile(file, "utf8")) as Partial<GeoSeed>
  assertString(json.brandName, "brandName")
  assertString(json.industry, "industry")
  assertString(json.region, "region")
  assertStringArray(json.queries, "queries")
  assertStringArray(json.brandAliases, "brandAliases")
  assertStringArray(json.negativeKeywords, "negativeKeywords")
  assertPages(json.pages)
  return json as GeoSeed
}

async function main() {
  const { file, email, replace, dryRun } = parseArgs()
  const seed = await readSeed(file)

  if (dryRun) {
    const queries = seed.queries.map((text, index) => ({
      seedKey: `${SOURCE}:${index + 1}`,
      text,
      intentType: identifyQueryIntentType(text),
      promptEqualsQueryText: true,
    }))

    console.log(
      JSON.stringify(
        {
          mode: "dry-run",
          brandName: seed.brandName,
          industry: seed.industry,
          region: seed.region,
          siteUrl: seed.siteUrl ?? null,
          queryCount: queries.length,
          aliases: seed.brandAliases,
          negativeKeywords: seed.negativeKeywords,
          pages: seed.pages,
          queries,
        },
        null,
        2
      )
    )
    return
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: getDatabaseUrl() }),
  })

  try {
    const user = await prisma.user.findFirst({
      where: { email },
      include: { tenant: true },
    })

    if (!user) throw new Error(`User not found for email: ${email}`)
    if (user.clerkUserId === DEV_USER_ID) {
      throw new Error("Refusing to import seed into dev user")
    }
    if (!user.tenant) {
      throw new Error(`Tenant not found for email: ${email}`)
    }

    const tenant = await prisma.tenant.update({
      where: { id: user.tenant.id },
      data: {
        brandName: seed.brandName,
        industry: seed.industry,
        region: seed.region,
      },
    })

    const brandProfile = await prisma.brandProfile.upsert({
      where: { tenantId: tenant.id },
      create: {
        tenantId: tenant.id,
        brandName: seed.brandName,
        industry: seed.industry,
        region: seed.region,
        siteUrl: seed.siteUrl ?? null,
        brandAliases: seed.brandAliases,
        negativeKeywords: seed.negativeKeywords,
        sourcePagesJson: seed.pages,
        seedSourcePath: path.resolve(file),
        seedImportedAt: new Date(),
      },
      update: {
        brandName: seed.brandName,
        industry: seed.industry,
        region: seed.region,
        siteUrl: seed.siteUrl ?? null,
        brandAliases: seed.brandAliases,
        negativeKeywords: seed.negativeKeywords,
        sourcePagesJson: seed.pages,
        seedSourcePath: path.resolve(file),
        seedImportedAt: new Date(),
      },
    })

    let importedCount = 0
    let skippedExistingSeed = 0
    let skippedManualDuplicates = 0

    for (const [index, text] of seed.queries.entries()) {
      const seedKey = `${SOURCE}:${index + 1}`
      const intentType = identifyQueryIntentType(text)
      const existingSeedQuery = await prisma.query.findFirst({
        where: { tenantId: tenant.id, source: SOURCE, seedKey },
      })
      const existingTextQuery = await prisma.query.findFirst({
        where: { tenantId: tenant.id, text },
      })

      if (existingSeedQuery) {
        if (replace) {
          await prisma.query.update({
            where: { id: existingSeedQuery.id },
            data: {
              text,
              active: true,
              platform: "deepseek",
              source: SOURCE,
              seedKey,
              intentType,
              sortOrder: index,
            },
          })
          importedCount += 1
        } else {
          skippedExistingSeed += 1
        }
        continue
      }

      if (existingTextQuery) {
        if (existingTextQuery.source !== SOURCE) {
          skippedManualDuplicates += 1
          continue
        }

        if (replace) {
          await prisma.query.update({
            where: { id: existingTextQuery.id },
            data: {
              active: true,
              platform: "deepseek",
              source: SOURCE,
              seedKey,
              intentType,
              sortOrder: index,
            },
          })
          importedCount += 1
        } else {
          skippedExistingSeed += 1
        }
        continue
      }

      await prisma.query.create({
        data: {
          tenantId: tenant.id,
          text,
          active: true,
          platform: "deepseek",
          source: SOURCE,
          seedKey,
          intentType,
          sortOrder: index,
        },
      })
      importedCount += 1
    }

    console.log(
      JSON.stringify(
        {
          tenantId: tenant.id,
          tenantName: tenant.name,
          brandProfileId: brandProfile.id,
          importedCount,
          skippedExistingSeed,
          skippedManualDuplicates,
          source: SOURCE,
          replace,
        },
        null,
        2
      )
    )
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(formatError(error))
  process.exit(1)
})
