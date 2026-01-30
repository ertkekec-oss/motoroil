import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { marketplace, items } = body; // items: [{ code: 'M123', name: '...' }]

        if (!marketplace || !items || !Array.isArray(items)) {
            return NextResponse.json({ success: false, error: 'Eksik veri' }, { status: 400 });
        }

        // 1. Veritabanındaki mevcut eşleşmeleri bul
        const codes = items.map((i: any) => i.code).filter(c => c);

        const existingMaps = await prisma.marketplaceProductMap.findMany({
            where: {
                marketplace: marketplace,
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

        // 2. Eşleşmeyenleri belirle
        // Sonuç formatı: { 'M123': { isMapped: true, product: ... }, 'M999': { isMapped: false } }
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
