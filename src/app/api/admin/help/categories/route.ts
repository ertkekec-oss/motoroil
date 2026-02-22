import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getSession();
    if (!session || (session.tenantId !== 'PLATFORM_ADMIN' && session.role !== 'SUPER_ADMIN' && session.role !== 'SUPPORT_AGENT')) {
        return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    try {
        const categories = await prisma.helpCategory.findMany({
            orderBy: { order: 'asc' }
        });
        return NextResponse.json({ success: true, categories });
    } catch (error: any) {
        return NextResponse.json({ error: 'İşlem sırasında bir hata oluştu.' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getSession();
    if (!session || (session.tenantId !== 'PLATFORM_ADMIN' && session.role !== 'SUPER_ADMIN' && session.role !== 'SUPPORT_AGENT')) {
        return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    try {
        const { name, description, slug, order } = await req.json();

        if (!name || !slug) {
            return NextResponse.json({ error: 'Kategori adı ve kısa URL (slug) zorunludur.' }, { status: 400 });
        }

        const category = await prisma.helpCategory.create({
            data: {
                name,
                description,
                slug,
                order: parseInt(order) || 0
            }
        });

        return NextResponse.json({ success: true, category });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Bu bağlantı adresi (slug) zaten kullanılıyor.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'İşlem sırasında bir hata oluştu.' }, { status: 500 });
    }
}
