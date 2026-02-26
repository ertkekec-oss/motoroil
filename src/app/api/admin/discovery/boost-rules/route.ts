import { NextRequest, NextResponse } from "next/server";
import { createBoostRule } from "@/services/network/discovery/boosts";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Assume authentication is handled by a middleware or requirePlatformFinanceAdmin guard
export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();

        const rule = await createBoostRule({
            scope: body.scope,
            targetId: body.targetId,
            multiplier: Number(body.multiplier),
            startsAt: new Date(body.startsAt),
            endsAt: new Date(body.endsAt),
            createdByTenantId: 'PLATFORM_ADMIN' // Use actual admin tenant/user in production
        });

        return NextResponse.json({ success: true, rule });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Bad Request" }, { status: 400 });
    }
}

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const active = searchParams.get('active') !== 'false';

    try {
        const rules = await prisma.boostRule.findMany({
            where: { isActive: active },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ rules });
    } catch (e: any) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
