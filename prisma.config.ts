import { config } from "dotenv"
import { defineConfig } from "prisma/config"

config({ path: ".env.local" })
config({ path: ".env" })

const fallbackDatabaseUrl =
  "postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // `prisma generate` only needs a syntactically valid URL. This keeps
    // demo/preview builds working when the real database is not configured yet.
    url: process.env.DATABASE_URL ?? fallbackDatabaseUrl,
  },
})
