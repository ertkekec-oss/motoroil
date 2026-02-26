import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { runPayoutOutboxCycle } from "@/services/finance/payout/iyzico/outboxWorker";

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session || !session.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json().catch(() => ({}));
        const limit = Number(body.batchSize) || 10;
        const result = await runPayoutOutboxCycle({ batchSize: limit });

        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
