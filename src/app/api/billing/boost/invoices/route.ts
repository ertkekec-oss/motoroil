import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getRequestContext } from '@/lib/api-context';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    const ctx = await getRequestContext(req);
    const tenantId = ctx.tenantId;
    
    try {
        const invoices = await prisma.boostInvoice.findMany({
            where: { sellerTenantId: tenantId },
            orderBy: { createdAt: 'desc' },
            include: { subscription: { select: { planId: true } } }
        });
        
        return NextResponse.json({ success: true, invoices });
    } catch(e) {
        const err = e as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
