import { NextRequest, NextResponse } from "next/server";
import { computeOpsHealth } from "@/services/ops/health";
import { requirePlatformFinanceAdmin } from "@/lib/auth"; // assumed exists

export async function GET(req: NextRequest) {
    try {
        await requirePlatformFinanceAdmin();
        const health = await computeOpsHealth();
        return NextResponse.json(health);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 403 });
    }
}
