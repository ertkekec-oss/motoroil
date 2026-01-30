import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const marketplaces = await prisma.marketplaceConfig.findMany();
        const settings = await prisma.appSettings.findMany({
            where: {
                key: { in: ['eFaturaSettings', 'posSettings'] }
            }
        });

        const marketplaceMap: Record<string, any> = {};
        marketplaces.forEach(m => {
            marketplaceMap[m.type] = m.settings;
        });

        const settingsMap: Record<string, any> = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });

        return NextResponse.json({
            success: true,
            marketplaceSettings: marketplaceMap,
            eFaturaSettings: settingsMap.eFaturaSettings || null,
            posSettings: settingsMap.posSettings || null
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { marketplaceSettings, eFaturaSettings, posSettings } = body;

        // 1. Marketplace Settings (Dedicated Table)
        if (marketplaceSettings) {
            const promises = Object.keys(marketplaceSettings).map(async (key) => {
                const config = marketplaceSettings[key];
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
        }

        // 2. E-Fatura Settings (General Table)
        if (eFaturaSettings) {
            await prisma.appSettings.upsert({
                where: { key: 'eFaturaSettings' },
                update: { value: eFaturaSettings as any },
                create: { key: 'eFaturaSettings', value: eFaturaSettings as any }
            });
        }

        // 3. POS Settings (General Table)
        if (posSettings) {
            await prisma.appSettings.upsert({
                where: { key: 'posSettings' },
                update: { value: posSettings as any },
                create: { key: 'posSettings', value: posSettings as any }
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Tüm entegrasyon ayarları veritabanına kaydedildi.'
        });

    } catch (error: any) {
        console.error('Settings Save Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
