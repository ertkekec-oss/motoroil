import { NextRequest, NextResponse } from "next/server";
import { quarantinePayout } from "@/services/ops/commands";
import { requirePlatformFinanceAdmin } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await requirePlatformFinanceAdmin();
        const { id } = await params;
        const body = await req.json();
        const res = await quarantinePayout({ 
            adminUserId: session.id, 
            providerPayoutId: id,
            reason: body.reason || 'Manually quarantined'
        });
        return NextResponse.json(res);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
