-- CreateEnum
CREATE TYPE "RunTriggerType" AS ENUM ('CRON', 'MANUAL');

-- CreateEnum
CREATE TYPE "RunBatchStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'PARTIAL_FAILURE', 'FAILED');

-- CreateEnum
CREATE TYPE "QueryRunStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "TrendDirection" AS ENUM ('UP', 'FLAT', 'DOWN');

-- CreateTable
CREATE TABLE "RunBatch" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "triggerType" "RunTriggerType" NOT NULL,
    "status" "RunBatchStatus" NOT NULL DEFAULT 'PENDING',
    "queryCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "errorSummary" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RunBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueryRun" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "queryId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" "QueryRunStatus" NOT NULL DEFAULT 'PENDING',
    "prompt" TEXT NOT NULL,
    "rawOutput" TEXT,
    "mentioned" BOOLEAN NOT NULL DEFAULT false,
    "rank" INTEGER,
    "competitors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QueryRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsightSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "mentionRate" INTEGER NOT NULL,
    "averageRank" DOUBLE PRECISION,
    "competitorList" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "trendDirection" "TrendDirection" NOT NULL,
    "anomalyFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InsightSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RunBatch_tenantId_createdAt_idx" ON "RunBatch"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "RunBatch_tenantId_status_idx" ON "RunBatch"("tenantId", "status");

-- CreateIndex
CREATE INDEX "QueryRun_batchId_createdAt_idx" ON "QueryRun"("batchId", "createdAt");

-- CreateIndex
CREATE INDEX "QueryRun_queryId_createdAt_idx" ON "QueryRun"("queryId", "createdAt");

-- CreateIndex
CREATE INDEX "QueryRun_status_idx" ON "QueryRun"("status");

-- CreateIndex
CREATE UNIQUE INDEX "InsightSnapshot_batchId_key" ON "InsightSnapshot"("batchId");

-- CreateIndex
CREATE INDEX "InsightSnapshot_tenantId_createdAt_idx" ON "InsightSnapshot"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "RunBatch" ADD CONSTRAINT "RunBatch_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueryRun" ADD CONSTRAINT "QueryRun_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "RunBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueryRun" ADD CONSTRAINT "QueryRun_queryId_fkey" FOREIGN KEY ("queryId") REFERENCES "Query"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightSnapshot" ADD CONSTRAINT "InsightSnapshot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightSnapshot" ADD CONSTRAINT "InsightSnapshot_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "RunBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
