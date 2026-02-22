
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const sessionResult: any = await getSession();
        const session = sessionResult?.user || sessionResult;
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Resolve Staff record
        const staffUser = await (prisma as any).staff.findFirst({
            where: {
                OR: [
                    { email: session.email },
                    { username: session.username || session.email }
                ]
            }
        });

        if (!staffUser) {
            return NextResponse.json({ customers: [] });
        }

        const customers = await (prisma as any).customer.findMany({
            where: {
                companyId: staffUser.companyId,
                OR: [
                    { assignedStaffId: staffUser.id },
                    { categoryId: { in: staffUser.assignedCategoryIds } }
                ],
                deletedAt: null
            },
            include: {
                category: true
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({ success: true, customers });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
