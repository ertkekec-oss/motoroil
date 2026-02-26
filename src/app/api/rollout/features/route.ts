import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { getSession } from "@/lib/auth";
import { isFeatureEnabled } from "@/services/rollout/featureFlags";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || !session.tenantId) {
             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const tenantId = session.tenantId;

        // Collect all global feature keys
        const globals = await prisma.featureFlag.findMany({ select: { key: true } });
        
        const payload: Record<string, boolean> = {};

        for (const f of globals) {
             payload[f.key] = await isFeatureEnabled({ tenantId, key: f.key });
        }

        // Return combined resolved flags for current tenant
        return NextResponse.json(payload);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
