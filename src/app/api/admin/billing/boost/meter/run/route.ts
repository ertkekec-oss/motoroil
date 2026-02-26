import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { requirePlatformFinanceAdmin } from "@/lib/auth";
import { meterDiscoveryRequest } from "@/services/billing/boost/metering";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        await requirePlatformFinanceAdmin();
        const body = await req.json().catch(() => ({}));

        const batchSize = body.batchSize || 100;
        
        // Find distinct requestIds from impressions that don't have a BillingState yet
        const unmeteredRaw = await prisma.$queryRaw`
            SELECT DISTINCT "requestId"
            FROM "DiscoveryImpression" i
            WHERE i."isSponsored" = true
              AND NOT EXISTS (
                  SELECT 1 FROM "DiscoveryRequestBillingState" b WHERE b."requestId" = i."requestId"
              )
            LIMIT ${batchSize}
        ` as { requestId: string }[];

        const results = [];
        for (const req of unmeteredRaw) {
              const res = await meterDiscoveryRequest({ requestId: req.requestId });
              results.push(res);
        }

        return NextResponse.json({ success: true, count: results.length, results });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
