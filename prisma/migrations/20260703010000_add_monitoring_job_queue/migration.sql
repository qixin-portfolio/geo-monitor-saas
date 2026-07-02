CREATE TABLE "MonitoringJob" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonitoringJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MonitoringJob_tenantId_status_idx" ON "MonitoringJob"("tenantId", "status");
CREATE INDEX "MonitoringJob_batchId_idx" ON "MonitoringJob"("batchId");

ALTER TABLE "MonitoringJob"
ADD CONSTRAINT "MonitoringJob_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MonitoringJob"
ADD CONSTRAINT "MonitoringJob_batchId_fkey"
FOREIGN KEY ("batchId") REFERENCES "RunBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
