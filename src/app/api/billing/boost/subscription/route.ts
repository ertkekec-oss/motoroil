import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getActiveBoostSubscription } from "@/services/billing/boost/subscriptions";

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || !session.tenantId) {
             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const sub = await getActiveBoostSubscription(session.tenantId);
        return NextResponse.json(sub);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
