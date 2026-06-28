import { config } from "dotenv"

config({ path: ".env.local" })
config({ path: ".env" })

function parseArgs() {
  return {
    force: process.argv.includes("--force"),
  }
}

async function main() {
  const { force } = parseArgs()
  const { getPrisma } = await import("../src/lib/prisma")
  const { analyzeQueryRun } = await import("../src/lib/analysis/analyze-query-run")
  const prisma = getPrisma()
  const runs = await prisma.queryRun.findMany({
    where: {
      status: "SUCCESS",
      ...(force ? {} : { analysis: null }),
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  })

  let success = 0
  const failed: Array<{ id: string; error: string }> = []

  for (const run of runs) {
    try {
      await analyzeQueryRun(run.id)
      success += 1
      console.log(`[analysis] ${success}/${runs.length} ${run.id}`)
    } catch (error) {
      failed.push({
        id: run.id,
        error: error instanceof Error ? error.message : "unknown-error",
      })
      console.error(`[analysis] failed ${run.id}`, error)
    }
  }

  console.log(
    JSON.stringify(
      {
        total: runs.length,
        success,
        failed: failed.length,
        failedIds: failed.map((item) => item.id),
      },
      null,
      2
    )
  )

  await prisma.$disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
