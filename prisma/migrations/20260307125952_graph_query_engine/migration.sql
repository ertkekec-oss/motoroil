-- CreateEnum
CREATE TYPE "GraphQueryActorType" AS ENUM ('TENANT', 'ADMIN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "GraphQueryType" AS ENUM ('NEIGHBORHOOD_LOOKUP', 'SUPPLIER_NEIGHBORHOOD', 'BUYER_NEIGHBORHOOD', 'CATEGORY_CLUSTER_DISCOVERY', 'REGION_CLUSTER_DISCOVERY', 'GRAPH_PROXIMITY_SEARCH', 'CAPABILITY_MATCH_GRAPH_SEARCH', 'TRUST_WEIGHTED_GRAPH_SEARCH');

-- CreateEnum
CREATE TYPE "GraphQueryExecutionMode" AS ENUM ('CACHE_ONLY', 'CACHE_WITH_FALLBACK', 'LIVE_COMPUTE', 'REBUILD_TRIGGERED');

-- CreateTable
CREATE TABLE "CompanyGraphNeighborhoodSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "profileId" TEXT,
    "hopDistance" INTEGER NOT NULL,
    "categoryId" TEXT,
    "regionCode" TEXT,
    "totalReachableNodes" INTEGER NOT NULL,
    "directSupplierCount" INTEGER NOT NULL,
    "directBuyerCount" INTEGER NOT NULL,
    "indirectSupplierCount" INTEGER NOT NULL,
    "indirectBuyerCount" INTEGER NOT NULL,
    "avgTrustScore" DOUBLE PRECISION,
    "avgShippingReliability" DOUBLE PRECISION,
    "clusterDensityScore" DOUBLE PRECISION,
    "explanationJson" JSONB NOT NULL,
    "calculationVersion" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "isStale" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL,
    "supersededAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyGraphNeighborhoodSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyGraphClusterSnapshot" (
    "id" TEXT NOT NULL,
    "clusterKey" TEXT NOT NULL,
    "categoryId" TEXT,
    "regionCode" TEXT,
    "city" TEXT,
    "clusterSize" INTEGER NOT NULL,
    "avgTrustScore" DOUBLE PRECISION,
    "avgShippingReliability" DOUBLE PRECISION,
    "activeSupplierCount" INTEGER NOT NULL,
    "activeBuyerCount" INTEGER NOT NULL,
    "categoryDensityScore" DOUBLE PRECISION NOT NULL,
    "relationshipDensityScore" DOUBLE PRECISION NOT NULL,
    "growthScore" DOUBLE PRECISION,
    "explanationJson" JSONB NOT NULL,
    "calculationVersion" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "isStale" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL,
    "supersededAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyGraphClusterSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GraphQueryAuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "actorType" "GraphQueryActorType" NOT NULL,
    "queryType" "GraphQueryType" NOT NULL,
    "queryHash" TEXT NOT NULL,
    "filtersJson" JSONB NOT NULL,
    "resultCount" INTEGER NOT NULL,
    "executionMode" "GraphQueryExecutionMode" NOT NULL,
    "cacheHit" BOOLEAN NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GraphQueryAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyGraphNeighborhoodSnapshot_dedupeKey_key" ON "CompanyGraphNeighborhoodSnapshot"("dedupeKey");

-- CreateIndex
CREATE INDEX "CompanyGraphNeighborhoodSnapshot_tenantId_hopDistance_statu_idx" ON "CompanyGraphNeighborhoodSnapshot"("tenantId", "hopDistance", "status");

-- CreateIndex
CREATE INDEX "CompanyGraphNeighborhoodSnapshot_categoryId_regionCode_hopD_idx" ON "CompanyGraphNeighborhoodSnapshot"("categoryId", "regionCode", "hopDistance", "status");

-- CreateIndex
CREATE INDEX "CompanyGraphNeighborhoodSnapshot_calculationVersion_isStale_idx" ON "CompanyGraphNeighborhoodSnapshot"("calculationVersion", "isStale");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyGraphClusterSnapshot_dedupeKey_key" ON "CompanyGraphClusterSnapshot"("dedupeKey");

-- CreateIndex
CREATE INDEX "CompanyGraphClusterSnapshot_clusterKey_status_idx" ON "CompanyGraphClusterSnapshot"("clusterKey", "status");

-- CreateIndex
CREATE INDEX "CompanyGraphClusterSnapshot_categoryId_clusterSize_status_idx" ON "CompanyGraphClusterSnapshot"("categoryId", "clusterSize", "status");

-- CreateIndex
CREATE INDEX "CompanyGraphClusterSnapshot_regionCode_city_status_idx" ON "CompanyGraphClusterSnapshot"("regionCode", "city", "status");

-- CreateIndex
CREATE INDEX "CompanyGraphClusterSnapshot_calculationVersion_isStale_idx" ON "CompanyGraphClusterSnapshot"("calculationVersion", "isStale");

-- CreateIndex
CREATE INDEX "GraphQueryAuditLog_queryType_createdAt_idx" ON "GraphQueryAuditLog"("queryType", "createdAt");

-- CreateIndex
CREATE INDEX "GraphQueryAuditLog_tenantId_queryType_createdAt_idx" ON "GraphQueryAuditLog"("tenantId", "queryType", "createdAt");
