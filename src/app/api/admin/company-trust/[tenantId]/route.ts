import { NextResponse } from "next/server";
import { getCompanyTrustProfile } from "@/domains/company-identity/services/companyTrust.service";
import { listTrustSignals } from "@/domains/company-identity/services/companyTrustSignal.service";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request, props: { params: Promise<{ tenantId: string }> }) {
    const params = await props.params;
    try {
        const session = await getSession();
        const isPlatformAdmin = session?.role === "SUPER_ADMIN" || session?.tenantId === "PLATFORM_ADMIN";

        if (!session || !isPlatformAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { tenantId } = params;

        const profile = await getCompanyTrustProfile(tenantId);
        if (!profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        const signals = await listTrustSignals(tenantId);
        const history = await prisma.companyTrustScoreHistory.findMany({
            where: { tenantId },
            orderBy: { calculatedAt: "desc" },
            take: 10,
        });

        return NextResponse.json({
            profile,
            signals,
            history
        });
    } catch (error) {
        console.error(`Failed to fetch tenant ${params.tenantId} trust profile:`, error);
        return NextResponse.json({ error: "Failed to fetch trust profile" }, { status: 500 });
    }
}
