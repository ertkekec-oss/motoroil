import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export async function GET() {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const { user } = auth;

    try {
        // Get company for tenant isolation
        const company = await prisma.company.findFirst({
            where: { tenantId: (user as any).tenantId }
        });

        if (!company) {
            return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });
        }

        const marketplaces = await prisma.marketplaceConfig.findMany({
            where: { companyId: company.id }
        });

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
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const { user } = auth;

    try {
        const body = await request.json();
        const { marketplaceSettings, eFaturaSettings, posSettings } = body;

        // Get the company for this tenant
        const company = await prisma.company.findFirst({
            where: { tenantId: (user as any).tenantId }
        });

        if (!company) {
            return NextResponse.json({ success: false, error: 'Firma kaydı bulunamadı.' }, { status: 400 });
        }

        const companyId = company.id;

        // 1. Marketplace Settings (Dedicated Table)
        if (marketplaceSettings) {
            const promises = Object.keys(marketplaceSettings).map(async (key) => {
                const config = marketplaceSettings[key];

                // 1. Validate & Normalize Type
                const normalizedType = key.toLowerCase().trim();
                const allowedTypes = ['trendyol', 'hepsiburada', 'n11', 'amazon', 'custom'];

                if (!allowedTypes.includes(normalizedType)) {
                    console.warn(`[Marketplace Save] Skipped invalid provider type: ${key}`);
                    return null;
                }

                // 2. Strict Boolean & Validation
                const isActive = Boolean(config?.enabled);

                // 3. Upsert with Normalized Type
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

        // 2. E-Fatura Settings (General Table)
        if (eFaturaSettings) {
            // Ideally appSettings should also be company scoped, but the current schema for appSettings might be global or different.
            // Looking at the findMany in GET, it seems global or tenant-agnostic in the current code, which is risky.
            // However, to fix the specific error asked, I will focus on marketplaceConfig.
            // If appSettings needs companyId, it should be added, but based on the existing code
            // creating 'key' unique constraint, it might be shared or simply key-based.
            // Let's assume for now appSettings logic remains as is or requires a schema check.
            // Wait, if appSettings is key-based only, it's global.
            // Retaining existing logic for appSettings for now to minimize side effects, 
            // but strongly advising to scope it to company if schema supports it.
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
