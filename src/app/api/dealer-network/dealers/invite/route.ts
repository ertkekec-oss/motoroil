import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        return NextResponse.json({ success: true, message: "Davetiye gönderildi." });
    } catch {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}
