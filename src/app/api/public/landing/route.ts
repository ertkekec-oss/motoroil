
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const [settings, page, menus] = await Promise.all([
            (prisma as any).cmsGeneralSettings.findFirst(),
            (prisma as any).cmsPage.findUnique({
                where: { slug: 'index' },
                include: { sections: { orderBy: { order: 'asc' }, where: { isActive: true } } }
            }),
            (prisma as any).cmsMenu.findMany()
        ]);

        return NextResponse.json({
            settings: settings || {
                siteTitle: 'Periodya',
                logoUrl: null,
                primaryColor: '#446ee7',
                whatsappNumber: ''
            },
            sections: page?.sections || [],
            menus: menus || []
        });
    } catch (error) {
        console.error('Public CMS GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch CMS content' }, { status: 500 });
    }
}
