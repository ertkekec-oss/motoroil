export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = session.user || session;
        const tenantId = session.tenantId || user.tenantId;

        if (!tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 400 });

        const banners = await prisma.networkBanner.findMany({
            where: { tenantId },
            orderBy: { order: 'asc' }
        });

        return NextResponse.json(banners);

    } catch (e) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = session.user || session;
        const tenantId = session.tenantId || user.tenantId;

        if (!user.permissions?.includes('b2b_manage') && !['TENANT_OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();

        // Let's get the max order
        const max = await prisma.networkBanner.aggregate({
            where: { tenantId },
            _max: { order: true }
        });
        const nextOrder = (max._max.order ?? 0) + 1;

        const banner = await prisma.networkBanner.create({
            data: {
                tenantId,
                imageUrl: body.imageUrl,
                linkUrl: body.linkUrl || null,
                placement: body.placement || "main",
                isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
                order: typeof body.order === 'number' ? body.order : nextOrder
            }
        });

        return NextResponse.json(banner);

    } catch (e) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
