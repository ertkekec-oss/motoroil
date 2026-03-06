import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyOtp } from '@/actions/contracts/publicSigning';

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
    try {
        const body = await req.json();
        const code = body.code;

        if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 });

        const rawToken = (await params).token;
        const publicTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

        await verifyOtp(publicTokenHash, code);

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
