import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createOrUpdateSubMerchantForSeller } from "@/services/finance/payout/iyzico/onboarding";

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session || !session.tenantId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { payoutDestinationId, legalInfoMinimal } = body;

        const profile = await createOrUpdateSubMerchantForSeller(
            session.tenantId,
            payoutDestinationId,
            legalInfoMinimal || {}
        );

        return NextResponse.json({
            id: profile.id,
            status: profile.status,
            provider: profile.provider,
            // DO NOT RETURN subMerchantKey directly to client
        });
    } catch (e: any) {
        const status = e.statusCode || 400;
        return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
}
