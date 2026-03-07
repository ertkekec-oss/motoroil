import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const start = Date.now();
        const c = await cookies();
        const session = c.get('session');
        return NextResponse.json({ ok: true, session: !!session, time: Date.now() - start });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
