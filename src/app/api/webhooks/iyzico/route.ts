import { NextRequest, NextResponse } from "next/server";
import { ingestWebhook } from "@/services/finance/payout/iyzico/webhooks";

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const signature = req.headers.get('x-iyz-signature') || ''; // Pseudo header for Iyzico

        // Parse payload
        let payload: any;
        try {
            payload = JSON.parse(rawBody);
        } catch (e) {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        await ingestWebhook(signature, rawBody, payload);

        return NextResponse.json({ status: "success" });
    } catch (e: any) {
        if (e.message === 'Invalid signature') {
            return NextResponse.json({ error: "Unauthorized Signature" }, { status: 401 });
        }
        console.error("Webhook Ingest Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
