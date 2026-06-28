import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { config } from "dotenv"

config({ path: ".env.local" })
config()

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  })
  const users = await prisma.user.findMany({
    select: { id: true, email: true, clerkUserId: true, tenantId: true },
  })
  console.log("USERS:", JSON.stringify(users, null, 2))
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e.message); process.exit(1) })
