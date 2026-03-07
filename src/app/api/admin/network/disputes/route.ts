import { NextResponse } from 'next/server';
import { getRequestContext, apiError } from '@/lib/api-context'; // Assumes admin auth exists
import prisma from '@/lib/prisma';


export async function GET(req: Request) {
    try {
        // Note: ensure requireAdminContext is properly validating an admin scope
        const { userId } = await getRequestContext(req as any);

        // Retrieve query params like order, status, etc.
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');

        const where: any = {};
        if (status) where.status = status;
        if (priority) where.priority = priority;

        const disputes = await prisma.networkDispute.findMany({
            where,
            orderBy: { priority: 'desc', createdAt: 'desc' }, // High priority first
            include: {
                evidences: true, // Admins see all evidences
            }
        });

        return NextResponse.json({ success: true, disputes });
    } catch (error) {
        return apiError(error);
    }
}

