import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { submitSignature } from '@/actions/contracts/publicSigning';

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
    try {
        const rawToken = (await params).token;
        const publicTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

        const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "0.0.0.0";
        const userAgent = req.headers.get("user-agent") || "Unknown";

        const result = await submitSignature(publicTokenHash, ip, userAgent);

        return NextResponse.json({ success: true, redirectUrl: result.redirectUrl });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
