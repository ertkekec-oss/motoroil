import { NextRequest, NextResponse } from "next/server";
import { requirePlatformFinanceAdmin } from "@/lib/auth";
import { setTenantFeature } from "@/services/rollout/featureFlags";

export async function POST(req: NextRequest, { params }: { params: { tenantId: string } }) {
    try {
        const session = await requirePlatformFinanceAdmin();
        const body = await req.json().catch(() => ({}));

        if (!body.key || typeof body.enabled !== 'boolean') {
             return NextResponse.json({ error: 'Missing key or enabled boolean' }, { status: 400 });
        }

        const res = await setTenantFeature({
            adminUserId: session.id,
            tenantId: params.tenantId,
            key: body.key,
            enabled: body.enabled
        });

        return NextResponse.json(res);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
