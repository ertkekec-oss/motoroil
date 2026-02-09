
import { NextRequest } from 'next/server';
import { getSession } from './auth';
import prisma from './prisma';

export interface RequestContext {
    userId: string;
    username?: string;
    tenantId: string;
    companyId?: string | null;
    role: string;
}

export async function getRequestContext(req: NextRequest): Promise<RequestContext> {
    const session: any = await getSession();

    if (!session || !session.id) {
        throw new Error("UNAUTHORIZED: Oturum bulunamadı.");
    }

    const companyId = req.headers.get('X-Company-Id');

    // 1. Önce SaaS kullanıcısı mı diye bak (Tenant bazlı işlemler için)
    let user = await (prisma as any).user.findUnique({
        where: { id: session.id },
        select: { id: true, tenantId: true, role: true, lastActiveAt: true }
    });

    let isStaff = false;

    // 2. Eğer User tablosunda yoksa Staff tablosuna bak (Adminler ve Personeller burada olabilir)
    if (!user) {
        const staff = await (prisma as any).staff.findUnique({
            where: { id: session.id },
            select: { id: true, role: true, lastActive: true, tenantId: true }
        });

        if (staff) {
            isStaff = true;
            user = {
                id: staff.id,
                tenantId: staff.tenantId || 'PLATFORM_ADMIN',
                role: (staff.role || 'Staff').toUpperCase(),
                lastActiveAt: staff.lastActive
            };
        }
    }

    if (!user) {
        throw new Error("UNAUTHORIZED: Kullanıcı veritabanında bulunamadı.");
    }

    if (!user.tenantId) {
        throw new Error("FORBIDDEN: Kullanıcının Tenant bilgisi eksik.");
    }

    // --- ACTIVITY TRACKING ---
    const now = new Date();
    if (!user.lastActiveAt || (now.getTime() - new Date(user.lastActiveAt).getTime() > 60000)) {
        if (isStaff) {
            (prisma as any).staff.update({
                where: { id: user.id },
                data: { lastActive: now }
            }).catch((err: any) => console.error("Staff LastActive update failed:", err));
        } else {
            (prisma as any).user.update({
                where: { id: user.id },
                data: { lastActiveAt: now }
            }).catch((err: any) => console.error("LastActive update failed:", err));
        }
    }

    return {
        userId: user.id,
        username: session.username,
        tenantId: user.tenantId,
        companyId: companyId,
        role: user.role
    };
}

export async function assertCompanyAccess(userId: string, companyId: string) {
    const access = await (prisma as any).userCompanyAccess.findUnique({
        where: {
            userId_companyId: {
                userId,
                companyId
            }
        },
        include: {
            company: {
                select: { tenantId: true }
            },
            user: {
                select: { tenantId: true }
            }
        }
    });

    if (!access) {
        throw new Error("FORBIDDEN: Bu şirkete erişim yetkiniz yok.");
    }

    if (access.user.tenantId && access.company.tenantId && access.user.tenantId !== access.company.tenantId) {
        throw new Error("SECURITY ALERT: Cross-Tenant Access Attempt Detected!");
    }

    return true;
}

export async function assertSubscriptionIsActive(tenantId: string) {
    if (tenantId === 'PLATFORM_ADMIN') return true;

    const subscription = await (prisma as any).subscription.findUnique({
        where: { tenantId }
    });

    if (!subscription || subscription.status === 'TRIAL_EXPIRED' || subscription.status === 'PAST_DUE' || subscription.status === 'SUSPENDED') {
        throw new Error("PAYMENT_REQUIRED: Aboneliğiniz aktif değil. Lütfen planınızı güncelleyin.");
    }
    return true;
}

export async function featureGate(ctx: RequestContext, featureKey: string) {
    if (ctx.tenantId === 'PLATFORM_ADMIN') return true;

    const subscription = await (prisma as any).subscription.findUnique({
        where: { tenantId: ctx.tenantId },
        include: {
            plan: {
                include: {
                    features: {
                        include: {
                            feature: true
                        }
                    }
                }
            }
        }
    });

    if (!subscription) {
        throw new Error("FORBIDDEN: Abonelik bulunamadı.");
    }

    const hasFeature = subscription.plan.features.some(pf => pf.feature.key === featureKey);

    if (!hasFeature) {
        throw new Error(`FORBIDDEN: Bu özellik (${featureKey}) mevcut planınızda (${subscription.plan.name}) bulunmuyor. Üst pakete geçiş yapınız.`);
    }

    return true;
}

export async function quotaGate(ctx: RequestContext, resourceKey: string) {
    if (ctx.tenantId === 'PLATFORM_ADMIN') return true;

    const subscription = await (prisma as any).subscription.findUnique({
        where: { tenantId: ctx.tenantId },
        include: {
            plan: {
                include: {
                    limits: true
                }
            }
        }
    });

    if (!subscription) throw new Error("Abonelik bulunamadı.");

    const limitObj = subscription.plan.limits.find(l => l.resource === resourceKey);
    const limit = limitObj ? limitObj.limit : 0;

    if (limit === -1) return true;

    let usage = 0;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    if (resourceKey === 'monthly_documents') {
        const companies = await (prisma as any).company.findMany({
            where: { tenantId: ctx.tenantId },
            select: { id: true }
        });
        const companyIds = companies.map(c => c.id);

        usage = await (prisma as any).salesInvoice.count({
            where: {
                companyId: { in: companyIds },
                isFormal: true,
                createdAt: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            }
        });
    }

    if (usage >= limit) {
        throw new Error(`QUOTA_EXCEEDED: Aylık işlem limitiniz doldu (${usage}/${limit}). Üst pakete geçiş yapınız.`);
    }

    return true;
}
