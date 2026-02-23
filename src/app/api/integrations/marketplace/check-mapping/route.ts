import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export async function POST(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    try {
        const body = await request.json();
        const { marketplace, items } = body; // items: [{ code: 'M123', name: '...' }]

        if (!marketplace || !items || !Array.isArray(items)) {
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

        // 1. Veritabanındaki mevcut eşleşmeleri bul (sadece bu şirkete ait)
        const codes = items.map((i: any) => i.code).filter(c => c);

        const existingMaps = await prisma.marketplaceProductMap.findMany({
            where: {
                companyId,
                marketplace,
                marketplaceCode: { in: codes }
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        stock: true
                    }
                }
            }
        });

        // 2. Sonuç formatı: { 'M123': { isMapped: true, product: ... }, 'M999': { isMapped: false } }
        const result: Record<string, any> = {};

        for (const item of items) {
            if (!item.code) continue;

            const map = existingMaps.find(m => m.marketplaceCode === item.code);
            if (map) {
                result[item.code] = {
                    isMapped: true,
                    internalProduct: map.product
                };
            } else {
                result[item.code] = {
                    isMapped: false,
                    marketplaceName: item.name
                };
            }
        }

        return NextResponse.json({ success: true, mappings: result });

    } catch (error: any) {
        console.error('Mapping Check Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
