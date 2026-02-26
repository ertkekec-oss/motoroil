import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { processWebhookEvents } from "@/services/finance/payout/iyzico/webhooks";

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session || !session.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const result = await processWebhookEvents();
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
