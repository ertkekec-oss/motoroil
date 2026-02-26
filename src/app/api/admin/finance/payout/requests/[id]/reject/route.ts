import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { rejectPayoutRequest } from "@/services/finance/payout/requests";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getSession();
    if (!session || !session.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json().catch(() => ({}));

        const request = await rejectPayoutRequest({
            adminUserId: session.userId,
            payoutRequestId: params.id,
            reason: body.reason
        });

        return NextResponse.json(request);
    } catch (e: any) {
        const status = e.statusCode || 400;
        return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
}
