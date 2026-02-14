
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
    const sessionResult: any = await getSession();
    const session = sessionResult?.user || sessionResult;

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.role?.toUpperCase())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { title, slug } = body;

        const page = await (prisma as any).cmsPage.create({
            data: {
                title: title || 'Yeni Sayfa',
                slug: slug || `page-${Date.now()}`,
                isActive: true
            }
        });

        return NextResponse.json(page);
    } catch (error) {
        console.error('CMS PAGE POST Error:', error);
        return NextResponse.json({ error: 'Failed to create page' }, { status: 500 });
    }
}
