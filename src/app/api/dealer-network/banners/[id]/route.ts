import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = session.user || session;
        const tenantId = session.tenantId || user.tenantId;

        if (!user.permissions?.includes('b2b_manage') && !['TENANT_OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();

        const banner = await prisma.networkBanner.updateMany({
            where: {
                id: params.id,
                tenantId
            },
            data: {
                imageUrl: body.imageUrl,
                linkUrl: body.linkUrl,
                placement: body.placement,
                isActive: body.isActive,
                order: body.order
            }
        });

        if (banner.count === 0) {
            return NextResponse.json({ error: 'Not Found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });

    } catch (e) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = session.user || session;
        const tenantId = session.tenantId || user.tenantId;

        if (!user.permissions?.includes('b2b_manage') && !['TENANT_OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const banner = await prisma.networkBanner.deleteMany({
            where: {
                id: params.id,
                tenantId
            }
        });

        if (banner.count === 0) {
            return NextResponse.json({ error: 'Not Found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });

    } catch (e) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
