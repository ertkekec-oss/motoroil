import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRequestContext } from '@/lib/api-context';

export async function GET(req: NextRequest) {
    try {
        const { userId, role } = await getRequestContext(req);
        // check if admin
        if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const searchParams = req.nextUrl.searchParams;
        const status = searchParams.get('status');
        const tenantId = searchParams.get('tenantId');

        const filter: any = {};
        if (status) {
            filter.status = status;
        }
        if (tenantId) {
            filter.tenantId = tenantId;
        }

        const submissions = await prisma.tenantRequirementSubmission.findMany({
            where: filter,
            include: {
                requirement: true,
                tenant: true,
                user: true
            },
            orderBy: { createdAt: 'desc' },
            take: 200
        });

        const sigFilter: any = {};
        if (tenantId) {
            sigFilter.tenantId = tenantId;
        }

        // Also fetch signatures
        const signatures = await prisma.tenantContractSignature.findMany({
            where: sigFilter,
            include: {
                contract: true,
                tenant: true,
                user: true
            },
            orderBy: { signedAt: 'desc' },
            take: 200
        });

        return NextResponse.json({ success: true, submissions, signatures });
    } catch (error: any) {
        console.error('Fetch submissions error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
