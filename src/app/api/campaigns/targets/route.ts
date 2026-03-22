import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = (session as any).tenantId;
        const companyId = session.companyId;

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const q = searchParams.get('q') || '';

        if (!q || q.length < 2) {
            return NextResponse.json([]);
        }

        const whereClause: any = {
            deletedAt: null
        };

        if (companyId) {
            whereClause.companyId = companyId;
        } else if (tenantId) {
            const company = await prisma.company.findFirst({
                where: { tenantId }
            });
            if (company) {
                whereClause.companyId = company.id;
            }
        }

        if (type === 'PRODUCT') {
            const products = await prisma.product.findMany({
                where: {
                    ...whereClause,
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { code: { contains: q, mode: 'insensitive' } }
                    ]
                },
                take: 10,
                select: { id: true, name: true, code: true }
            });
            return NextResponse.json(products.map(p => ({ label: `${p.code} - ${p.name}`, value: p.code })));
        } 
        
        if (type === 'CATEGORY') {
            // Get unique categories matching q
            const products = await prisma.product.findMany({
                where: {
                    ...whereClause,
                    category: { contains: q, mode: 'insensitive' }
                },
                select: { category: true },
                distinct: ['category'],
                take: 10
            });
            return NextResponse.json(products.map(p => ({ label: p.category, value: p.category })).filter(x => x.label));
        }

        if (type === 'BRAND') {
            // Get unique brands matching q
            const products = await prisma.product.findMany({
                where: {
                    ...whereClause,
                    brand: { contains: q, mode: 'insensitive' }
                },
                select: { brand: true },
                distinct: ['brand'],
                take: 10
            });
            return NextResponse.json(products.map(p => ({ label: p.brand, value: p.brand })).filter(x => x.label));
        }

        return NextResponse.json([]);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
