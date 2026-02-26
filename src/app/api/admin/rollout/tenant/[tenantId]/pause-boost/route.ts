import { NextRequest, NextResponse } from "next/server";
import { requirePlatformFinanceAdmin } from "@/lib/auth";
import { pauseBoost } from "@/services/rollout/rollback";

export async function POST(req: NextRequest, { params }: { params: { tenantId: string } }) {
    try {
        const session = await requirePlatformFinanceAdmin();
        const res = await pauseBoost(session.id, params.tenantId);
        return NextResponse.json(res);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 403 });
    }
}
