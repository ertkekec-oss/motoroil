import { NextRequest, NextResponse } from "next/server";
import { resolveIntegrityAlert } from "@/services/ops/alerts";
import { requirePlatformFinanceAdmin } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await requirePlatformFinanceAdmin();
        const { id } = await params;
        const body = await req.json();
        const res = await resolveIntegrityAlert({
             adminUserId: session.id,
             alertId: id,
             note: body.note || 'Manually resolved'
        });
        return NextResponse.json(res);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
