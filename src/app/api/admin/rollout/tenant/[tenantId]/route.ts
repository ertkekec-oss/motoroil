import { NextRequest, NextResponse } from "next/server";
import { requirePlatformFinanceAdmin } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { tenantId: string } }) {
    try {
        await requirePlatformFinanceAdmin();

        const policy = await prisma.tenantRolloutPolicy.findUnique({
             where: { tenantId: params.tenantId }
        });

        const flags = await prisma.tenantFeatureFlag.findMany({
             where: { tenantId: params.tenantId }
        });

        const cohortTags = await prisma.pilotCohortTag.findMany({
             where: { tenantId: params.tenantId }
        });

        return NextResponse.json({ policy, flags, cohortTags });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
