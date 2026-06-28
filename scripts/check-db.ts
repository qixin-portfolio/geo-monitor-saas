import { Pool } from "pg"
const pool = new Pool()
async function main() {
  const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")
  console.log("TABLES:", tables.rows.map(r => r.table_name).join(", "))
  const enums = await pool.query("SELECT typname FROM pg_type WHERE typname='QueryIntentType'")
  console.log("ENUM QueryIntentType:", enums.rows.length > 0 ? "EXISTS" : "MISSING")
  const bp = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_name='BrandProfile'")
  console.log("TABLE BrandProfile:", bp.rows.length > 0 ? "EXISTS" : "MISSING")
  const migs = await pool.query("SELECT migration_name FROM _prisma_migrations ORDER BY finished_at")
  console.log("MIGRATIONS:", migs.rows.map((r: { migration_name: string }) => r.migration_name).join(" | "))
  const users = await pool.query('SELECT id, email, clerk_user_id FROM "User" LIMIT 5')
  console.log("USERS:", JSON.stringify(users.rows))
  await pool.end()
}
main().catch(e => { console.error(e.message); process.exit(1) })
