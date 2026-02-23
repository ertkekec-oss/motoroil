-- CreateTable
CREATE TABLE "CustomerLocationRequest" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "requestedLat" DOUBLE PRECISION NOT NULL,
    "requestedLng" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerLocationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerLocationRequest_companyId_idx" ON "CustomerLocationRequest"("companyId");

-- CreateIndex
CREATE INDEX "CustomerLocationRequest_status_idx" ON "CustomerLocationRequest"("status");

-- AddForeignKey
ALTER TABLE "CustomerLocationRequest" ADD CONSTRAINT "CustomerLocationRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerLocationRequest" ADD CONSTRAINT "CustomerLocationRequest_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerLocationRequest" ADD CONSTRAINT "CustomerLocationRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
