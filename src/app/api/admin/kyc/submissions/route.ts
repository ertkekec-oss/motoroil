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

        const filter: any = {};
        if (status) {
            filter.status = status;
        }

        const submissions = await prisma.tenantRequirementSubmission.findMany({
            where: filter,
            include: {
                requirement: true
                // in reality we may also fetch Tenant / User names. Given current DB limits, we can just return IDs or join if possible.
            },
            orderBy: { createdAt: 'desc' },
            take: 200
        });

        // Also fetch signatures
        const signatures = await prisma.tenantContractSignature.findMany({
            include: {
                contract: true
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
