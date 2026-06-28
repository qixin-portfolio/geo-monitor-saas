-- CreateEnum
CREATE TYPE "GeoContentTaskType" AS ENUM ('ARTICLE', 'FAQ', 'CASE_PAGE', 'COMPARISON', 'LOCAL_SERVICE_PAGE', 'LLMSTXT', 'SCHEMA', 'SOCIAL_POST');

-- CreateEnum
CREATE TYPE "GeoContentTaskStatus" AS ENUM ('TODO', 'BRIEF_READY', 'DRAFT_READY', 'REVIEW_NEEDED', 'APPROVED', 'EXPORTED', 'SKIPPED');

-- CreateTable
CREATE TABLE "GeoContentTask" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "queryRunId" TEXT,
    "analysisId" TEXT,
    "title" TEXT NOT NULL,
    "type" "GeoContentTaskType" NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 50,
    "status" "GeoContentTaskStatus" NOT NULL DEFAULT 'TODO',
    "sourceQuery" TEXT,
    "sourceProvider" TEXT,
    "sourceModel" TEXT,
    "sourceReason" TEXT,
    "targetKeyword" TEXT,
    "targetAudience" TEXT,
    "recommendedAngle" TEXT,
    "evidenceJson" JSONB,
    "briefJson" JSONB,
    "draftMarkdown" TEXT,
    "reviewJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeoContentTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeoContentTask_tenantId_idx" ON "GeoContentTask"("tenantId");

-- CreateIndex
CREATE INDEX "GeoContentTask_queryRunId_idx" ON "GeoContentTask"("queryRunId");

-- CreateIndex
CREATE INDEX "GeoContentTask_analysisId_idx" ON "GeoContentTask"("analysisId");

-- CreateIndex
CREATE INDEX "GeoContentTask_status_idx" ON "GeoContentTask"("status");

-- CreateIndex
CREATE INDEX "GeoContentTask_type_idx" ON "GeoContentTask"("type");

-- AddForeignKey
ALTER TABLE "GeoContentTask" ADD CONSTRAINT "GeoContentTask_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
