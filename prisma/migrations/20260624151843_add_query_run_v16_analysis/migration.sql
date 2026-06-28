-- CreateEnum
CREATE TYPE "MentionStatus" AS ENUM ('NONE', 'MENTIONED', 'RECOMMENDED');

-- CreateEnum
CREATE TYPE "RankType" AS ENUM ('NONE', 'EXPLICIT', 'IMPLIED', 'UNRANKED');

-- CreateEnum
CREATE TYPE "ImpactLevel" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE');

-- AlterTable
ALTER TABLE "QueryRun" ADD COLUMN     "promptHash" TEXT,
ADD COLUMN     "surface" TEXT NOT NULL DEFAULT 'api';

-- CreateTable
CREATE TABLE "QueryRunAnalysis" (
    "id" TEXT NOT NULL,
    "queryRunId" TEXT NOT NULL,
    "mentionStatus" "MentionStatus" NOT NULL DEFAULT 'NONE',
    "rankType" "RankType" NOT NULL DEFAULT 'NONE',
    "brandMentioned" BOOLEAN NOT NULL DEFAULT false,
    "brandRank" INTEGER,
    "visibilityScore" DOUBLE PRECISION NOT NULL,
    "parserConfidence" DOUBLE PRECISION NOT NULL,
    "brandAliasesMatched" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "competitorsJson" JSONB NOT NULL DEFAULT '[]',
    "reasonTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "evidenceSpansJson" JSONB NOT NULL DEFAULT '[]',
    "citationsJson" JSONB NOT NULL DEFAULT '[]',
    "summary" TEXT,
    "impactLevel" "ImpactLevel" NOT NULL DEFAULT 'NEUTRAL',
    "parserVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueryRunAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderAttempt" (
    "id" TEXT NOT NULL,
    "queryRunId" TEXT NOT NULL,
    "attemptNo" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "httpStatus" INTEGER,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "latencyMs" INTEGER,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "totalTokens" INTEGER,
    "estimatedCostCny" DECIMAL(12,6),
    "rawRequestJson" JSONB,
    "rawResponseJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QueryRunAnalysis_queryRunId_key" ON "QueryRunAnalysis"("queryRunId");

-- CreateIndex
CREATE INDEX "QueryRunAnalysis_mentionStatus_idx" ON "QueryRunAnalysis"("mentionStatus");

-- CreateIndex
CREATE INDEX "QueryRunAnalysis_impactLevel_idx" ON "QueryRunAnalysis"("impactLevel");

-- CreateIndex
CREATE INDEX "ProviderAttempt_queryRunId_createdAt_idx" ON "ProviderAttempt"("queryRunId", "createdAt");

-- CreateIndex
CREATE INDEX "ProviderAttempt_provider_model_idx" ON "ProviderAttempt"("provider", "model");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderAttempt_queryRunId_attemptNo_key" ON "ProviderAttempt"("queryRunId", "attemptNo");

-- AddForeignKey
ALTER TABLE "QueryRunAnalysis" ADD CONSTRAINT "QueryRunAnalysis_queryRunId_fkey" FOREIGN KEY ("queryRunId") REFERENCES "QueryRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderAttempt" ADD CONSTRAINT "ProviderAttempt_queryRunId_fkey" FOREIGN KEY ("queryRunId") REFERENCES "QueryRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
