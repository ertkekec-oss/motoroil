import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    return NextResponse.json({
        data: {
            loginMode: "OTP_REQUIRED",
            inviteExpiry: "7",
            riskDefault: "WARNING"
        }
    });
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        return NextResponse.json({ success: true, message: "Politikalar güncellendi", data: body });
    } catch {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}
