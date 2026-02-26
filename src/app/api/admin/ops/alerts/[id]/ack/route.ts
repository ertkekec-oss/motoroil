import { NextRequest, NextResponse } from "next/server";
import { ackAlert } from "@/services/ops/alerts";
import { requirePlatformFinanceAdmin } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await requirePlatformFinanceAdmin();
        const { id } = await params;
        const body = await req.json();
        
        // Assume type is also passed or derivable. Actually we need alertType as well.
        // We'll trust the body for alertType.
        const res = await ackAlert({
             adminUserId: session.id,
             alertType: body.alertType,
             alertId: id,
             note: body.note || 'Manually acknowledged'
        });
        
        return NextResponse.json(res);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
