import { NextRequest, NextResponse } from "next/server";
import { requirePlatformFinanceAdmin } from "@/lib/auth";
import { pauseBoostSubscription } from "@/services/billing/boost/subscriptions";

export async function POST(req: NextRequest) {
    try {
        const session = await requirePlatformFinanceAdmin();
        const body = await req.json();

        const sub = await pauseBoostSubscription({
             adminUserId: session.id,
             sellerTenantId: body.sellerTenantId,
             reason: body.reason || 'Admin pause'
        });

        return NextResponse.json({ success: true, sub });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
