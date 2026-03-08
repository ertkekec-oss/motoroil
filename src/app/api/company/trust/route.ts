import { NextResponse } from "next/server";
import { getCompanyTrustProfile } from "@/domains/company-identity/services/companyTrust.service";
import { buildTenantTrustPresentation } from "@/domains/company-identity/utils/trustPresentation";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.tenantId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const tId = session.tenantId;
        const profile = await getCompanyTrustProfile(tId);

        if (!profile) {
            return NextResponse.json({
                status: "NO_PROFILE",
                overallScore: 0,
                trustLevel: "LOW",
                lastCalculatedAt: null,
                metrics: {
                    identityScore: 0,
                    tradeScore: 0,
                    shippingScore: 0,
                    paymentScore: 0,
                    disputeScore: 0
                }
            });
        }

        const presentation = buildTenantTrustPresentation(profile);

        return NextResponse.json({
            overallScore: presentation.score100,
            trustLevel: presentation.segmentLabel,
            lastCalculatedAt: profile.lastCalculatedAt,
            metrics: presentation.metrics,
        });
    } catch (error) {
        console.error("Failed to fetch tenant trust profile:", error);
        return NextResponse.json({ error: "Failed to fetch trust profile" }, { status: 500 });
    }
}
