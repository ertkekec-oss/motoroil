import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export async function POST(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    try {
        const body = await request.json();
        const { marketplace, mappings } = body;
        // mappings: [{ marketplaceCode: 'M123', productId: 'p1' }, ...]

        if (!marketplace || !mappings || !Array.isArray(mappings)) {
            return NextResponse.json({ success: false, error: 'Eksik veri' }, { status: 400 });
        }

        // Aktif şirketin ID'sini al (tenant isolation)
        const company = await prisma.company.findFirst({
            where: { tenantId: auth.user.tenantId },
            select: { id: true }
        });

        if (!company) {
            return NextResponse.json({ success: false, error: 'Firma bulunamadı' }, { status: 404 });
        }

        const companyId = company.id;

        let savedCount = 0;

        for (const map of mappings) {
            if (!map.marketplaceCode || !map.productId) continue;

            // Upsert — companyId + marketplace + marketplaceCode unique key ile
            await prisma.marketplaceProductMap.upsert({
                where: {
                    companyId_marketplace_marketplaceCode: {
                        companyId,
                        marketplace,
                        marketplaceCode: map.marketplaceCode
                    }
                },
                update: {
                    productId: map.productId
                },
                create: {
                    companyId,
                    marketplace,
                    marketplaceCode: map.marketplaceCode,
                    productId: map.productId
                }
            });
            savedCount++;
        }

        return NextResponse.json({ success: true, count: savedCount });

    } catch (error: any) {
        console.error('Save Mapping Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
