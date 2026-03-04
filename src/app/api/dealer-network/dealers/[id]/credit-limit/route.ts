import { NextResponse } from 'next/server';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        return NextResponse.json({ success: true, message: `Kredi limiti güncellendi: ${params.id}`, limit: body.creditLimit });
    } catch {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}
