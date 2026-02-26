import { NextRequest, NextResponse } from "next/server";
import { requirePlatformFinanceAdmin } from "@/lib/auth";
import { createOrActivateBoostSubscription } from "@/services/billing/boost/subscriptions";

export async function POST(req: NextRequest) {
    try {
        const session = await requirePlatformFinanceAdmin();
        const body = await req.json();

        const sub = await createOrActivateBoostSubscription({
             adminUserId: session.id,
             sellerTenantId: body.sellerTenantId,
             planCode: body.planCode
        });

        return NextResponse.json({ success: true, sub });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
