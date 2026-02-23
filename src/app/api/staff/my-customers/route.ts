
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

        // If staff has no specific category or assigned customers, show all customers of the company
        // Otherwise, filter by their assignments.
        const where: any = {
            companyId: staffUser.companyId,
            deletedAt: null
        };

        const hasCategoryAssignments = staffUser.assignedCategoryIds && staffUser.assignedCategoryIds.length > 0;
        const hasAssignedCustomers = await (prisma as any).customer.count({
            where: { assignedStaffId: staffUser.id, deletedAt: null }
        }) > 0;

        if (hasCategoryAssignments || hasAssignedCustomers) {
            where.OR = [];
            if (hasCategoryAssignments) {
                where.OR.push({ categoryId: { in: staffUser.assignedCategoryIds } });
            }
            if (hasAssignedCustomers) {
                where.OR.push({ assignedStaffId: staffUser.id });
            }
        }

        const customers = await (prisma as any).customer.findMany({
            where: where,
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
