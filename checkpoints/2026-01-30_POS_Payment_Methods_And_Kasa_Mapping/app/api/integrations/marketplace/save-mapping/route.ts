import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { marketplace, mappings } = body;
        // mappings: [{ marketplaceCode: 'M123', productId: 'p1' }, ...]

        if (!marketplace || !mappings || !Array.isArray(mappings)) {
            return NextResponse.json({ success: false, error: 'Eksik veri' }, { status: 400 });
        }

        let savedCount = 0;

        for (const map of mappings) {
            if (!map.marketplaceCode || !map.productId) continue;

            // Upsert (Varsa güncelle, yoksa ekle - ama biz unique constraint koyduk, upsert güvenli)
            await prisma.marketplaceProductMap.upsert({
                where: {
                    marketplace_marketplaceCode: {
                        marketplace: marketplace,
                        marketplaceCode: map.marketplaceCode
                    }
                },
                update: {
                    productId: map.productId
                },
                create: {
                    marketplace: marketplace,
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
