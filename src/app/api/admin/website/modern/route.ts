import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
    const sessionResult: any = await getSession();
    const session = sessionResult?.user || sessionResult;

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session?.role?.toUpperCase())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { hero, tabs, integrations } = body;

        let page = await (prisma as any).cmsPage.findFirst({ where: { slug: 'index' } });
        if (!page) {
            page = await (prisma as any).cmsPage.create({ data: { title: 'Ana Sayfa', slug: 'index', isActive: true } });
        }

        // Delete old MODERN sections
        await (prisma as any).cmsSection.deleteMany({
            where: {
                pageId: page.id,
                type: { in: ['MODERN_HERO', 'MODERN_TABS', 'MODERN_INTEGRATIONS'] }
            }
        });

        // Insert new sections
        await (prisma as any).cmsSection.createMany({
            data: [
                { pageId: page.id, type: 'MODERN_HERO', order: 0, content: hero },
                { pageId: page.id, type: 'MODERN_TABS', order: 1, content: { items: tabs } },
                { pageId: page.id, type: 'MODERN_INTEGRATIONS', order: 2, content: { items: integrations } }
            ]
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("CMS POST Error:", e);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
