import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

// ──────────────────────────────────────────────────────────────────────
// WARNING: 本地开发 / QA 环境专用诊断脚本
//
// 此脚本会连接数据库并可能调用 AI Provider API（消耗配额）。
// 默认在生产环境禁止运行。
// 如需在生产环境执行，请显式设置：
//   ALLOW_PRODUCTION_DIAGNOSE=true
//
// 不会输出以下内容：
//   - API Key
//   - 完整 DATABASE_URL
//   - CRON_SECRET
//
// ──────────────────────────────────────────────────────────────────────

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not configured. Set it in .env.local or environment."
    );
  }
  return url;
}

const deepseekKey = process.env.DEEPSEEK_API_KEY || "";

async function main() {
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction && process.env.ALLOW_PRODUCTION_DIAGNOSE !== "true") {
    throw new Error(
      "Diagnosis script is guarded for production. " +
      "Set ALLOW_PRODUCTION_DIAGNOSE=true to override."
    );
  }
  const envLabel = isProduction ? "PRODUCTION" : "DEVELOPMENT";
  console.log("=== GEO Monitor Diagnostic (" + envLabel + ") ===\n");

  const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });
  const prisma = new PrismaClient({ adapter, log: [] });

  try {
    console.log("1. Database...");
    await prisma.$queryRawUnsafe("SELECT 1");
    console.log("   OK\n");
  } catch (e) {
    console.error("   FAIL:", e.message);
    process.exit(1);
  }

  const tenants = await prisma.tenant.findMany({ select: { id: true, name: true, brandName: true } });
  console.log("2. Tenants:", tenants.length);
  tenants.forEach(t => console.log("   -", t.name, "(brand:", t.brandName + ")"));

  const queries = await prisma.query.findMany({ select: { id: true, text: true, active: true, tenantId: true } });
  console.log("3. Queries:", queries.length);
  queries.forEach(q => console.log("   - [" + (q.active ? "active" : "inactive") + "]", q.text));

  const stuck = await prisma.runBatch.findMany({ where: { status: { in: ["PENDING", "RUNNING"] } } });
  console.log("4. Stuck batches:", stuck.length);
  if (stuck.length > 0) {
    for (const b of stuck) {
      await prisma.runBatch.update({ where: { id: b.id }, data: { status: "FAILED", finishedAt: new Date(), errorSummary: "Force-cleared by diagnostic" } });
      console.log("   Cleared:", b.id);
    }
  }

  const recent = await prisma.runBatch.findMany({ orderBy: { createdAt: "desc" }, take: 3 });
  console.log("5. Recent batches:", recent.length);
  recent.forEach(b => console.log("   -", b.status, "(" + b.queryCount + " queries)", b.createdAt));

  console.log("6. DeepSeek API...");
  if (!deepseekKey) {
    console.log("   SKIP: no key");
  } else {
    const client = new OpenAI({ apiKey: deepseekKey, baseURL: "https://api.deepseek.com" });
    try {
      const start = Date.now();
      const res = await client.chat.completions.create({ model: "deepseek-chat", messages: [{ role: "user", content: "OK" }], max_tokens: 10 });
      console.log("   OK:", res.choices[0]?.message?.content, "(" + (Date.now() - start) + "ms)");
    } catch (e) {
      console.error("   FAIL:", e.message);
    }
  }

  console.log("7. End-to-end query test...");
  const tenant = tenants[0];
  const activeQ = queries.filter(q => q.active && q.tenantId === tenant?.id);
  if (!tenant || activeQ.length === 0) {
    console.log("   SKIP");
  } else {
    const q = activeQ[0];
    const prompt = "你是一个本地推荐场景分析助手。\n品牌：" + tenant.brandName + "\n用户问题：" + q.text + "\n请列出推荐名单。";
    const client = new OpenAI({ apiKey: deepseekKey, baseURL: "https://api.deepseek.com" });
    const start = Date.now();
    const res = await client.chat.completions.create({ model: "deepseek-chat", messages: [{ role: "user", content: prompt }] });
    const output = res.choices[0]?.message?.content ?? "";
    console.log("   OK:", output.length, "chars", "(" + (Date.now() - start) + "ms)");
    console.log("   Preview:", output.substring(0, 300));
  }

  console.log("\n=== Done ===");
  await prisma.$disconnect();
}

main().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
