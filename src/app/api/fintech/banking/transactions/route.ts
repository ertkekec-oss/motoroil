import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const ctx = await getRequestContext(req);
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '50');

        const where: any = {};

        // Only filter by companyId if not platform admin or if explicitly requested
        if (ctx.tenantId !== 'PLATFORM_ADMIN') {
            if (!ctx.companyId) {
                // FALLBACK: If header is missing (e.g. Onboarding), try to find the default company for this tenant
                const defaultCompany = await (prisma as any).company.findFirst({
                    where: { tenantId: ctx.tenantId }
                });

                if (!defaultCompany) {
                    // Valid 400 if really no company exists? 
                    // Better: Return empty list to prevent UI errors during onboarding
                    return NextResponse.json({ success: true, transactions: [] });
                }
                where.companyId = defaultCompany.id;
            } else {
                where.companyId = ctx.companyId;
            }
        } else if (ctx.companyId) {
            where.companyId = ctx.companyId;
        }

        const transactions = await (prisma as any).bankTransaction.findMany({
            where,
            include: {
                connection: true,
                matches: true
            },
            orderBy: {
                transactionDate: 'desc'
            },
            take: limit
        });

        return NextResponse.json({
            success: true,
            transactions
        });

    } catch (error: any) {
        console.error('Fetch Bank Transactions Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
