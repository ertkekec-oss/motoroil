
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
    req: Request,
    { params }: { params: { slug: string } }
) {
    const slug = params.slug;

    try {
        const [settings, page] = await Promise.all([
            (prisma as any).cmsGeneralSettings.findFirst(),
            (prisma as any).cmsPage.findUnique({
                where: { slug },
                include: { sections: { orderBy: { order: 'asc' }, where: { isActive: true } } }
            })
        ]);

        if (!page) {
            return NextResponse.json({ error: 'Page not found' }, { status: 404 });
        }

        return NextResponse.json({
            settings: settings || {
                siteTitle: 'Periodya',
                logoUrl: null,
                primaryColor: '#446ee7',
                whatsappNumber: ''
            },
            title: page.title,
            sections: page.sections || []
        });
    } catch (error) {
        console.error(`CMS Page GET Error (${slug}):`, error);
        return NextResponse.json({ error: 'Failed to fetch CMS content' }, { status: 500 });
    }
}
