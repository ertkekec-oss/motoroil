
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        // 1. Yetki Kontrolü
        const session: any = await getSession();
        if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.role?.toUpperCase())) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const page = Number(searchParams.get('page')) || 1;
        const limit = Number(searchParams.get('limit')) || 20;
        const status = searchParams.get('status');
        const plan = searchParams.get('plan');
        const search = searchParams.get('search');

        const skip = (page - 1) * limit;

        // 2. Filtreler
        const where: any = {};

        if (status) where.status = status;

        if (plan) {
            where.subscription = {
                plan: { name: { contains: plan, mode: 'insensitive' } }
            };
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { ownerEmail: { contains: search, mode: 'insensitive' } }
            ];
        }

        // 3. Veri Çekme
        const [total, tenants] = await (prisma as any).$transaction([
            (prisma as any).tenant.count({ where }),
            (prisma as any).tenant.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    subscription: {
                        include: { plan: true }
                    },
                    companies: { select: { id: true, name: true } }, // Hafif veri
                    users: { select: { id: true } } // Sadece sayı için
                }
            })
        ]);

        // 4. İstatistik Ekleme (Advanced: Performans için ayrı query veya cache lazım olabilir)
        // Şimdilik N+1 problemine dikkat ederek veya basitçe her biri için count alarak ilerliyoruz.
        // Prisma transaction veya aggregate ile çözülebilir.
        // Hız için şimdilik sadece özet dönüyoruz.

        const data = await Promise.all(tenants.map(async (t: any) => {
            // Aylık fatura kullanımı
            const invoiceCount = await (prisma as any).salesInvoice.count({
                where: {
                    companyId: { in: t.companies.map((c: any) => c.id) },
                    isFormal: true,
                    createdAt: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                    }
                }
            });

            // Son aktiflik (Churn Risk Analizi)
            const tenantUsers = await (prisma as any).user.findMany({
                where: { tenantId: t.id },
                orderBy: { lastActiveAt: 'desc' },
                take: 1,
                select: { lastActiveAt: true }
            });

            const lastActive = tenantUsers[0]?.lastActiveAt;
            let risk = 'HEALTHY';
            if (!lastActive) risk = 'NEW';
            else {
                const daysDiff = (new Date().getTime() - new Date(lastActive).getTime()) / (1000 * 3600 * 24);
                if (daysDiff > 14) risk = 'HIGH_RISK';
                else if (daysDiff > 7) risk = 'RISK';
            }

            // Olay Sinyalleri (Growth Events)
            const growthEventsCount = await (prisma as any).growthEvent.count({
                where: { tenantId: t.id, status: 'PENDING' }
            });

            // Limit
            const invoiceLimit = t.subscription?.plan?.limits?.find((l: any) => l.resource === 'monthly_documents')?.limit || 0;
            const highValue = invoiceLimit !== -1 && invoiceLimit > 0 && (invoiceCount / invoiceLimit) >= 0.9;

            return {
                id: t.id,
                name: t.name,
                ownerEmail: t.ownerEmail,
                status: t.status,
                plan: t.subscription?.plan?.name || 'No Plan',
                subscriptionEndsAt: t.subscription?.endDate,
                highValue,
                risk,
                growthEventsCount,
                stats: {
                    companies: t.companies.length,
                    users: t.users.length,
                    invoices: invoiceCount,
                    invoiceLimit: invoiceLimit === -1 ? '∞' : invoiceLimit
                },
                createdAt: t.createdAt
            };
        }));

        return NextResponse.json({
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
