import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { processPayoutRequestInternal } from "@/services/finance/payout/processInternal";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getSession();
    if (!session || !session.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const result = await processPayoutRequestInternal({
            payoutRequestId: params.id,
            adminUserId: session.userId
        });

        return NextResponse.json(result);
    } catch (e: any) {
        const status = e.statusCode || 400;
        return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
}
