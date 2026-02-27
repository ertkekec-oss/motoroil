import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const auth = await authorize();
    if (!auth.authorized || !auth.user?.companyId || !auth.user?.tenantId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const score = await prisma.sellerTrustScore.findUnique({
            where: { sellerTenantId: auth.user.companyId }
        });

        // Parse componentsJson avoiding errors
        let components = {};
        if (score?.componentsJson) {
            components = typeof score.componentsJson === "string" ? JSON.parse(score.componentsJson) : score.componentsJson;
        }

        // Compute simulated policy effects based on tier
        let holdDaysDelta = 0;
        let earlyReleaseFeeRateDelta = 0;

        switch (score?.tier) {
            case "A": holdDaysDelta = -7; earlyReleaseFeeRateDelta = -2.0; break;
            case "B": holdDaysDelta = -3; earlyReleaseFeeRateDelta = -1.0; break;
            case "C": holdDaysDelta = 0; earlyReleaseFeeRateDelta = 0; break;
            case "D": holdDaysDelta = 7; earlyReleaseFeeRateDelta = 2.0; break;
            default: holdDaysDelta = 0; earlyReleaseFeeRateDelta = 0; break;
        }

        return NextResponse.json({
            score: {
                value: score?.score || 100,
                tier: score?.tier || "A",
                computedAt: score?.computedAt || new Date()
            },
            components,
            policyEffects: {
                holdDaysDelta,
                earlyReleaseFeeRateDelta
            }
        });

    } catch (e: any) {
        console.error("Trust Score API Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
