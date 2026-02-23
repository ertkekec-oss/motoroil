
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRequestContext } from '@/lib/api-context';
import { calculateUpsellSignal } from '@/lib/upsell-engine';

export async function GET(req: NextRequest) {
    try {
        const ctx = await getRequestContext(req);
        // Tenant'ın abonelik ve kullanım bilgilerini çek
        // Sadece Admin veya yetkili kullanıcı görebilmeli, assertCompanyAccess gerekebilir ama bu tenant-level bir sorgu.
        // Billing tenant'a aittir, company'ye değil. O yüzden ctx.tenantId yeterli.

        if (ctx.tenantId === 'PLATFORM_ADMIN') {
            return NextResponse.json({
                planName: 'PLATFORM ADMIN',
                status: 'ACTIVE',
                period: 'LIFETIME',
                endDate: new Date(2099, 11, 31),
                limits: {
                    monthly_documents: { used: 0, limit: -1, percent: 0 },
                    companies: { used: 0, limit: -1, percent: 0 },
                    users: { used: 0, limit: -1, percent: 0 }
                },
                features: ['*'],
                recommendedPlanId: null
            });
        }

        const subscription = await (prisma as any).subscription.findUnique({
            where: { tenantId: ctx.tenantId },
            include: {
                plan: {
                    include: {
                        features: { include: { feature: true } },
                        limits: true
                    }
                }
            }
        });

        if (!subscription) {
            return NextResponse.json({ error: 'Abonelik bulunamadı' }, { status: 404 });
        }

        // Kullanım İstatistiklerini Hesapla
        // 1. Aylık Döküman (Fatura) Kullanımı
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Tenant'a bağlı company'leri bul
        const companies = await (prisma as any).company.findMany({
            where: { tenantId: ctx.tenantId },
            select: { id: true }
        });
        const companyIds = companies.map((c: any) => c.id);

        const monthlyDocsUsage = await (prisma as any).salesInvoice.count({
            where: {
                companyId: { in: companyIds },
                isFormal: true,
                createdAt: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            }
        });

        // 2. Firma Sayısı
        const companyUsage = companyIds.length;

        // 3. Kullanıcı Sayısı (Tenant'a bağlı userlar)
        // User modelinde tenantId var.
        const userUsage = await (prisma as any).user.count({
            where: { tenantId: ctx.tenantId }
        });

        // 4. Şirket Çalışanı / Personel Sayısı
        const employeeUsage = await (prisma as any).staff.count({
            where: { tenantId: ctx.tenantId }
        });

        // Limitleri Eşleştir
        const getLimit = (key: string) => {
            const l = (subscription as any).plan.limits.find((l: any) => l.resource === key);
            return l ? l.limit : 0; // 0 = Yok demek
        };

        const overview = {
            planName: (subscription as any).plan.name,
            status: (subscription as any).status,
            period: (subscription as any).period,
            endDate: (subscription as any).endDate,
            limits: {
                monthly_documents: {
                    used: monthlyDocsUsage,
                    limit: getLimit('monthly_documents'),
                    percent: getLimit('monthly_documents') > 0 ? Math.round((monthlyDocsUsage / getLimit('monthly_documents')) * 100) : 0
                },
                companies: {
                    used: companyUsage,
                    limit: getLimit('companies'),
                    percent: getLimit('companies') > 0 ? Math.round((companyUsage / getLimit('companies')) * 100) : 0
                },
                users: {
                    used: userUsage,
                    limit: getLimit('users'),
                    percent: getLimit('users') > 0 ? Math.round((userUsage / getLimit('users')) * 100) : 0
                },
                employees: {
                    used: employeeUsage,
                    limit: getLimit('employees'),
                    percent: getLimit('employees') > 0 ? Math.round((employeeUsage / getLimit('employees')) * 100) : 0
                }
            },
            features: (subscription as any).plan.features.map((f: any) => f.feature.key)
        };

        // 4. Akıllı Öneri Mantığı (Upsell Optimization v2)
        const upsellSignal = await calculateUpsellSignal(ctx.tenantId, 'BILLING_PAGE');

        return NextResponse.json({
            ...overview,
            recommendedPlanId: upsellSignal?.targetPlanId || null,
            upsellSignal
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
