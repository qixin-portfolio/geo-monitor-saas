import { config } from "dotenv"

config({ path: ".env.local" })
config({ path: ".env" })

const DEFAULT_BATCH_ID = "cmqt24oao00004wuppahhnmmh"

function parseBatchId() {
  const batchArg = process.argv.find((arg) => arg.startsWith("--batchId="))
  if (batchArg) return batchArg.slice("--batchId=".length)

  const positional = process.argv[2]
  if (positional && !positional.startsWith("--")) return positional

  return DEFAULT_BATCH_ID
}

async function main() {
  const batchId = parseBatchId()
  const { getPrisma } = await import("../src/lib/prisma")
  const { generateGeoContentTasksFromBatch } = await import(
    "../src/lib/content-backlog/generate-tasks-from-batch"
  )

  const prisma = getPrisma()
  const result = await generateGeoContentTasksFromBatch({ batchId })
  const totalTasks = await prisma.geoContentTask.count({
    where: { tenantId: result.tenantId },
  })

  console.log(`[content-tasks] batchId=${result.batchId}`)
  console.log(`[content-tasks] tenantId=${result.tenantId}`)
  console.log(`[content-tasks] processedRuns=${result.processedRuns}`)
  console.log(`[content-tasks] created=${result.created.length}`)
  console.log(`[content-tasks] existing=${result.existing.length}`)
  console.log(`[content-tasks] skippedRuns=${result.skippedRuns.length}`)
  console.log(`[content-tasks] totalTenantTasks=${totalTasks}`)

  for (const task of result.created) {
    console.log(`[created] ${task.type} ${task.title}`)
  }
  for (const task of result.existing) {
    console.log(`[existing] ${task.type} ${task.title}`)
  }
  for (const skipped of result.skippedRuns) {
    console.log(`[skipped-run] ${skipped.id} ${skipped.reason}`)
  }

  await prisma.$disconnect()
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
