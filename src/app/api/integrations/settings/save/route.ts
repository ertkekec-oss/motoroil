import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize, resolveCompanyId } from '@/lib/auth';

export async function GET() {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const { user } = auth;

    try {
        // Resolve company context
        const companyId = await resolveCompanyId(user);
        if (!companyId) return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });

        const marketplaces = await prisma.marketplaceConfig.findMany({
            where: { companyId }
        });

        const settings = await prisma.appSettings.findMany({
            where: {
                companyId,
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
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const { user } = auth;

    try {
        const body = await request.json();
        const { marketplaceSettings, eFaturaSettings, posSettings } = body;

        // Resolve company context
        const companyId = await resolveCompanyId(user);
        if (!companyId) return NextResponse.json({ success: false, error: 'Firma kaydı bulunamadı.' }, { status: 400 });

        // 1. Marketplace Settings (Dedicated Table)
        if (marketplaceSettings) {
            const promises = Object.keys(marketplaceSettings).map(async (key) => {
                const config = marketplaceSettings[key];
                const normalizedType = key.toLowerCase().trim();
                const allowedTypes = ['trendyol', 'hepsiburada', 'n11', 'amazon', 'custom'];

                if (!allowedTypes.includes(normalizedType)) return null;

                const isActive = Boolean(config?.enabled);

                return prisma.marketplaceConfig.upsert({
                    where: {
                        companyId_type: {
                            companyId: companyId,
                            type: normalizedType
                        }
                    },
                    update: {
                        settings: config,
                        isActive: isActive,
                        updatedAt: new Date()
                    },
                    create: {
                        companyId: companyId,
                        type: normalizedType,
                        settings: config,
                        isActive: isActive
                    }
                });
            });
            await Promise.all(promises);
        }

        // 2. E-Fatura Settings (Scoped to Company)
        if (eFaturaSettings) {
            await prisma.appSettings.upsert({
                where: { companyId_key: { companyId, key: 'eFaturaSettings' } },
                update: { value: eFaturaSettings as any },
                create: { companyId, key: 'eFaturaSettings', value: eFaturaSettings as any }
            });
        }

        // 3. POS Settings (Scoped to Company)
        if (posSettings) {
            await prisma.appSettings.upsert({
                where: { companyId_key: { companyId, key: 'posSettings' } },
                update: { value: posSettings as any },
                create: { companyId, key: 'posSettings', value: posSettings as any }
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
