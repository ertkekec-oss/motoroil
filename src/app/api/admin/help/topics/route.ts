import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
    const session = await getSession();
    if (!session || (session.tenantId !== 'PLATFORM_ADMIN' && session.role !== 'SUPER_ADMIN' && session.role !== 'SUPPORT_AGENT')) {
        return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    try {
        const { title, slug, excerpt, body, categoryId, status, order, tenantId } = await req.json();

        if (!title || !slug || !body || !categoryId) {
            return NextResponse.json({ error: 'Gerekli alanları doldurunuz.' }, { status: 400 });
        }

        const topic = await prisma.helpTopic.create({
            data: {
                title,
                slug,
                excerpt,
                body,
                categoryId,
                status: status || 'DRAFT',
                order: parseInt(order) || 0,
                tenantId: tenantId === 'global' ? null : tenantId // tenantId null for global topics
            }
        });

        return NextResponse.json({ success: true, topic });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Bu bağlantı adresi (slug) zaten kullanılıyor.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'İşlem sırasında bir hata oluştu.', details: error.message }, { status: 500 });
    }
}
