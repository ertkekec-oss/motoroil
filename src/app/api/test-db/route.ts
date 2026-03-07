import { NextResponse } from 'next/server';
import { prismaBase } from '@/lib/prismaBase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const start = Date.now();
        console.log('[TEST-DB] Connecting to Prisma...');
        const count = await prismaBase.user.count();
        console.log('[TEST-DB] Connected successfully, count:', count);
        return NextResponse.json({ ok: true, count, time: Date.now() - start });
    } catch (e: any) {
        console.error('[TEST-DB] Error:', e);
        return NextResponse.json({ error: e.message });
    }
}
