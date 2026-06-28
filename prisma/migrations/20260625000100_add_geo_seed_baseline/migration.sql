-- CreateEnum
CREATE TYPE "QueryIntentType" AS ENUM ('NATURAL_RECOMMENDATION', 'BRAND_AWARENESS', 'FEATURE', 'OLD_HOUSE', 'BUDGET', 'SELECTION_GUIDE', 'OTHER');

-- AlterTable
ALTER TABLE "Query" ADD COLUMN "intentType" "QueryIntentType" NOT NULL DEFAULT 'NATURAL_RECOMMENDATION',
ADD COLUMN "source" TEXT,
ADD COLUMN "seedKey" TEXT,
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "RunBatch" ADD COLUMN "label" TEXT,
ADD COLUMN "source" TEXT;

-- CreateTable
CREATE TABLE "BrandProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "industry" TEXT,
    "region" TEXT,
    "siteUrl" TEXT,
    "brandAliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "negativeKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sourcePagesJson" JSONB,
    "seedSourcePath" TEXT,
    "seedImportedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BrandProfile_tenantId_key" ON "BrandProfile"("tenantId");

-- AddForeignKey
ALTER TABLE "BrandProfile" ADD CONSTRAINT "BrandProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
