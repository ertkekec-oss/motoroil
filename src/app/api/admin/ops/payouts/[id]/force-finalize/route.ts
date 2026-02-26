import { NextRequest, NextResponse } from "next/server";
import { forceFinalizeSucceededPayout } from "@/services/ops/commands";
import { requirePlatformFinanceAdmin } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await requirePlatformFinanceAdmin();
        const { id } = await params;
        const res = await forceFinalizeSucceededPayout({ adminUserId: session.id, providerPayoutId: id });
        return NextResponse.json(res);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
