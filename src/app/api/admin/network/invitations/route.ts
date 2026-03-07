import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const sessionResult: any = await getSession();
        const session = sessionResult?.user || sessionResult;
        const isPlatformAdmin = session?.role === 'SUPER_ADMIN' || session?.tenantId === 'PLATFORM_ADMIN' || session?.role === 'ADMIN';

        if (!session || !isPlatformAdmin) {
            return NextResponse.json({ error: 'Forbidden: Admin Access Required' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const page = Number(searchParams.get('page')) || 1;
        const limit = Number(searchParams.get('limit')) || 20;
        const skip = (page - 1) * limit;

        const [total, invitations] = await Promise.all([
            prisma.networkConnectionInvite.count(),
            prisma.networkConnectionInvite.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    fromProfile: true,
                    toProfile: true
                }
            })
        ]);

        return NextResponse.json({
            success: true,
            data: invitations,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
