import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const start = Date.now();
        const session = await getSession();
        return NextResponse.json({ ok: true, session: session?.id, time: Date.now() - start });
    } catch (e: any) {
        return NextResponse.json({ error: e.message, name: e.name });
    }
}
