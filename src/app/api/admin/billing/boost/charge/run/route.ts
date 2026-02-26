import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { requirePlatformFinanceAdmin } from "@/lib/auth";
import { chargeBoostSubscriptionUpfront } from "@/services/billing/boost/charges";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const session = await requirePlatformFinanceAdmin();
        const body = await req.json().catch(() => ({}));

        // Find all active subscriptions
        const subs = await prisma.boostSubscription.findMany({
             where: { status: 'ACTIVE' },
             select: { id: true, currentPeriodStart: true }
        });

        const results = [];
        for (const sub of subs) {
             const periodKey = `${sub.currentPeriodStart.getUTCFullYear()}-${String(sub.currentPeriodStart.getUTCMonth()+1).padStart(2,'0')}`;
             const idempotencyKey = `BOOST_CHARGE:${sub.id}:${periodKey}`;
             
             // Check if billed before charging to save transaction hits
             const existing = await prisma.billingLedgerRef.findUnique({ where: { idempotencyKey } });
             if (!existing) {
                  try {
                      const res = await chargeBoostSubscriptionUpfront({ adminUserId: session.id, subscriptionId: sub.id });
                      results.push(res);
                  } catch (e: any) {
                      results.push({ success: false, id: sub.id, error: e.message });
                  }
             }
        }

        return NextResponse.json({ success: true, count: results.length, results });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
