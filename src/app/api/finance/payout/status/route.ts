import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session || !session.tenantId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const profile = await prisma.sellerPaymentProfile.findUnique({
            where: { sellerTenantId: session.tenantId }
        });

        if (!profile) {
            return NextResponse.json({ onboarded: false });
        }

        return NextResponse.json({
            onboarded: true,
            status: profile.status,
            provider: profile.provider
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
