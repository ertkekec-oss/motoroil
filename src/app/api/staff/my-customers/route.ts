
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const sessionResult: any = await getSession();
        const session = sessionResult?.user || sessionResult;
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const conditions = [];
        if (session.email) conditions.push({ email: session.email });
        if (session.username) conditions.push({ username: session.username });
        if (session.id) conditions.push({ userId: session.id });
        
        // Resolve Staff or Admin record
        let staffUser = null;
        if (conditions.length > 0) {
            staffUser = await (prisma as any).staff.findFirst({
                where: { OR: conditions }
            });
        }
        if (!staffUser) {
            staffUser = await (prisma as any).staff.findUnique({
                where: { id: session.id }
            });
        }

        // If not a staff, they might be an Admin trying to view the mobile app
        if (!staffUser) {
            const adminUser = await (prisma as any).user.findUnique({
                where: { id: session.id }
            });
            
            if (adminUser) {
                // Return all customers for the admin's company / tenant
                const allCustomers = await (prisma as any).customer.findMany({
                    where: { companyId: adminUser.companyId, deletedAt: null },
                    include: { category: true },
                    orderBy: { name: 'asc' }
                });
                return NextResponse.json({ success: true, customers: allCustomers });
            }
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
