import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth"; // Adjust import to your codebase

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session || !session.tenantId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const score = await prisma.sellerTrustScore.findUnique({
            where: { sellerTenantId: session.tenantId },
            select: {
                id: true,
                score: true,
                tier: true,
                computedAt: true,
                windowStart: true,
                windowEnd: true,
                componentsJson: true
            }
        });

        if (!score) return NextResponse.json({ score: 100, tier: 'A', message: 'No score computed yet.' }); // Default baseline

        // Ensure no leakage possible by restricting purely to above properties
        return NextResponse.json(score);
    } catch (error: any) {
        console.error("Seller Trust Score Fetch Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
