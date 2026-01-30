
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { marketplaceSettings } = body;

        console.log('Ayarlar kaydediliyor...', Object.keys(marketplaceSettings));

        // Her bir pazaryeri ayarını veritabanına kaydet
        // settings objesini JSON'a çevirmeden direkt Prisma'nın Json tipine veriyoruz
        const promises = Object.keys(marketplaceSettings).map(async (key) => {
            const config = marketplaceSettings[key];

            // Sadece 'enabled' olanları veya hepsini kaydedebiliriz.
            // Hepsini kaydedelim, isActive flag'i enabled'a göre olsun.

            return prisma.marketplaceConfig.upsert({
                where: { type: key },
                update: {
                    settings: config,
                    isActive: config.enabled || false,
                    updatedAt: new Date()
                },
                create: {
                    type: key,
                    settings: config,
                    isActive: config.enabled || false
                }
            });
        });

        await Promise.all(promises);

        return NextResponse.json({
            success: true,
            message: 'Tüm ayarlar veritabanına güvenli şekilde kaydedildi.'
        });

    } catch (error: any) {
        console.error('Settings Save Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
