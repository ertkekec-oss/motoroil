import { NextResponse } from 'next/server';
import { authorize } from '@/lib/auth';
import { KnowledgeBaseInit } from '@/services/support/KnowledgeBaseInit';

export async function POST(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Sadece süper admin veya platform admin bu varsayılanları çekebilsin
    if (auth.user?.role !== 'SUPER_ADMIN' && auth.user?.tenantId !== 'PLATFORM_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        await KnowledgeBaseInit.seedDefaultCategories();
        return NextResponse.json({ success: true, message: 'DEFAULT_CATEGORIES seeded.' });
    } catch (error: any) {
        console.error('KB Engine Init Error:', error);
        return NextResponse.json({ error: 'Initialization Failed' }, { status: 500 });
    }
}
