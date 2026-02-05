import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestContext } from '@/lib/api-context';

/**
 * PHASE 9: GROWTH AUTOMATION ENGINE
 * Bu API, tüm tenantları ve kullanıcıları tarayarak belirli kurallara göre (Churn Risk, Quota, Growth)
 * GrowthEvent'ler ve asenkron bildirimler oluşturur.
 * Gerçek bir SaaS'ta bu endpoint bir Cron Job (Vercel Cron vb.) tarafından tetiklenir.
 */

export async function POST(req: NextRequest) {
    try {
        // Güvenlik: Sadece ADMIN rolü tetikleyebilir
        const ctx = await getRequestContext(req);
        if (ctx.role !== 'ADMIN' && ctx.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'FORBIDDEN: Yetkiniz yok.' }, { status: 403 });
        }

        const body = await req.json();
        const { tenantId, dryRun } = body;

        const stats = {
            inactivityEvents: 0,
            quotaEvents: 0,
            growthEvents: 0,
            processedTenants: 0
        };

        const now = new Date();

        // --- 1. HAREKETSİZLİK KONTROLÜ (REVENTION) ---
        // 7, 14 ve 21 gündür girmeyen kullanıcıları bul
        const inactivityThresholds = [
            { days: 7, type: 'INACTIVITY_7D' },
            { days: 14, type: 'INACTIVITY_14D' },
            { days: 21, type: 'INACTIVITY_21D' }
        ];

        for (const threshold of inactivityThresholds) {
            const dateLimit = new Date();
            dateLimit.setDate(now.getDate() - threshold.days);

            // Bu threshold'dan önce aktif olmuş ama threshold süresince gelmemiş kullanıcılar
            // Not: Sadece son aktiflik tarihine bakıyoruz.
            const where: any = {
                lastActiveAt: { lte: dateLimit },
                tenantId: { not: null }
            };
            if (tenantId) where.tenantId = tenantId;

            const inactiveUsers = await (prisma as any).user.findMany({
                where,
                select: { id: true, tenantId: true, name: true, email: true }
            });

            for (const user of inactiveUsers) {
                // Bu olay daha önce bu tenant için bu ay içinde oluşturulmuş mu? (Spam engelleme)
                const exists = await (prisma as any).growthEvent.findFirst({
                    where: {
                        tenantId: user.tenantId,
                        type: threshold.type,
                        createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) }
                    }
                });

                if (!exists) {
                    if (!dryRun) {
                        await (prisma as any).growthEvent.create({
                            data: {
                                tenantId: user.tenantId,
                                type: threshold.type,
                                status: 'PENDING',
                                payload: { userId: user.id, userEmail: user.email, userName: user.name }
                            }
                        });

                        // Ayrıca kullanıcıya in-app bildirim bırakalım (bir sonraki girişinde görsün)
                        await (prisma as any).notification.create({
                            data: {
                                userId: user.id,
                                title: 'Seni Özledik!',
                                message: `Periodya'yı ${threshold.days} gündür kullanmadığını fark ettik. Yeni özelliklerimize göz atmak ister misin?`,
                                type: 'INFO',
                                link: '/dashboard'
                            }
                        });
                    }
                    stats.inactivityEvents++;
                }
            }
        }

        // --- 2. QUOTA & LIMIT KONTROLÜ (CONVERSION) ---
        // Kotasının %80'ine gelen veya dolanları bul
        const subWhere: any = { status: 'ACTIVE' };
        if (tenantId) subWhere.tenantId = tenantId;

        const subscriptions = await (prisma as any).subscription.findMany({
            where: subWhere,
            include: { plan: { include: { limits: true } } }
        });

        stats.processedTenants = subscriptions.length;

        for (const sub of subscriptions) {
            const limit = sub.plan.limits.find((l: any) => l.resource === 'monthly_documents')?.limit || 0;
            if (limit <= 0) continue;

            const usage = await (prisma as any).salesInvoice.count({
                where: {
                    company: { tenantId: sub.tenantId },
                    isFormal: true,
                    createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) }
                }
            });

            const percent = (usage / limit) * 100;
            let type = '';
            if (percent >= 100) type = 'LIMIT_100';
            else if (percent >= 80) type = 'LIMIT_80';

            if (type) {
                const exists = await (prisma as any).growthEvent.findFirst({
                    where: {
                        tenantId: sub.tenantId,
                        type: type,
                        createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } // Günlük kontrol
                    }
                });

                if (!exists) {
                    if (!dryRun) {
                        await (prisma as any).growthEvent.create({
                            data: {
                                tenantId: sub.tenantId,
                                type: type,
                                status: 'PENDING',
                                payload: { usage, limit, percent }
                            }
                        });
                    }
                    stats.quotaEvents++;
                }
            }
        }

        // --- 3. BÜYÜME SİNYALİ (EXPANSION) ---
        // Aylık büyümesi %10'dan fazla olanları flag'le (High Value Upgrade Adayı)
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        for (const sub of subscriptions) {
            const [thisMonth, lastMonth] = await Promise.all([
                (prisma as any).salesInvoice.count({
                    where: {
                        company: { tenantId: sub.tenantId },
                        createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) }
                    }
                }),
                (prisma as any).salesInvoice.count({
                    where: {
                        company: { tenantId: sub.tenantId },
                        createdAt: { gte: lastMonthStart, lte: lastMonthEnd }
                    }
                })
            ]);

            if (lastMonth > 10 && thisMonth > lastMonth * 1.1) {
                const growthRate = Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
                const exists = await (prisma as any).growthEvent.findFirst({
                    where: {
                        tenantId: sub.tenantId,
                        type: 'GROWTH_SIGNAL',
                        createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) }
                    }
                });

                if (!exists) {
                    if (!dryRun) {
                        await (prisma as any).growthEvent.create({
                            data: {
                                tenantId: sub.tenantId,
                                type: 'GROWTH_SIGNAL',
                                status: 'PENDING',
                                payload: { thisMonth, lastMonth, growthRate }
                            }
                        });

                        // Bildirim (User-facing - Tebrik ve Upsell)
                        const users = await (prisma as any).user.findMany({
                            where: { tenantId: sub.tenantId, role: 'ADMIN' },
                            select: { id: true }
                        });

                        for (const u of users) {
                            await (prisma as any).notification.create({
                                data: {
                                    userId: u.id,
                                    title: 'İşlerin Büyüyor! 📈',
                                    message: `Bu ay geçen aya göre %${growthRate} daha fazla fatura kestin. Profesyonel özelliklerle daha hızlı büyümek ister misin?`,
                                    type: 'SUCCESS',
                                    link: '/billing'
                                }
                            });
                        }
                    }
                    stats.growthEvents++;
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: dryRun ? 'Simülasyon (Dry-Run) tamamlandı.' : 'Otomasyon motoru başarıyla çalıştı.',
            dryRun,
            stats
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
