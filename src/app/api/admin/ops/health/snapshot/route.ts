import { NextRequest, NextResponse } from "next/server";
import { computeOpsHealth, saveOpsHealthSnapshot } from "@/services/ops/health";
import { requirePlatformFinanceAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        await requirePlatformFinanceAdmin();
        const health = await computeOpsHealth();
        const snap = await saveOpsHealthSnapshot({ scope: 'RUNTIME', payloadJson: health });
        return NextResponse.json({ success: true, snapshotId: snap.id });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 403 });
    }
}
