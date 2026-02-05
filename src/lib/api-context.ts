
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

    // Kullanıcı detaylarını ve Tenant bilgisini çek
    const user = await (prisma as any).user.findUnique({
        where: { id: session.id },
        select: { id: true, tenantId: true, role: true, lastActiveAt: true }
    });

    if (!user) {
        throw new Error("UNAUTHORIZED: Kullanıcı veritabanında bulunamadı.");
    }

    if (!user.tenantId) {
        throw new Error("FORBIDDEN: Kullanıcının Tenant bilgisi eksik.");
    }

    // --- ACTIVITY TRACKING ---
    // Update lastActiveAt if it's been more than 1 minute since last update
    const now = new Date();
    if (!user.lastActiveAt || (now.getTime() - new Date(user.lastActiveAt).getTime() > 60000)) {
        (prisma as any).user.update({
            where: { id: user.id },
            data: { lastActiveAt: now }
        }).catch((err: any) => console.error("LastActive update failed:", err));
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
    // 1. Super Admin veya Platform Admin ise her yere girebilir mi?
    // Şimdilik strict kontrol yapalım: UserCompanyAccess kaydı var mı?

    // Ayrıca Tenant kontrolü de yapılmalı:
    // Kullanıcının tenant'ı ile Company'nin tenant'ı aynı mı?

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
        // Belki kullanıcı Tenant Admin'dir ve UserCompanyAccess tablosuna henüz eklenmemiştir?
        // Ancak Golden Template "Bu kontrol User ↔ Company access tablosunu kontrol eder" diyor.
        // O yüzden strict davranıyoruz.
        throw new Error("FORBIDDEN: Bu şirkete erişim yetkiniz yok.");
    }

    // Çifte Güvenlik: Tenant Mismatch Kontrolü
    if (access.user.tenantId && access.company.tenantId && access.user.tenantId !== access.company.tenantId) {
        throw new Error("SECURITY ALERT: Cross-Tenant Access Attempt Detected!");
    }

    return true;
}

export async function assertSubscriptionIsActive(tenantId: string) {
    const subscription = await (prisma as any).subscription.findUnique({
        where: { tenantId }
    });

    if (!subscription || subscription.status === 'TRIAL_EXPIRED' || subscription.status === 'PAST_DUE' || subscription.status === 'SUSPENDED') {
        // Trial süresi bitmiş veya ödemesi alınamamış olabilir.
        // Soft bir uyarı yerine strict bir blok koyuyoruz.
        throw new Error("PAYMENT_REQUIRED: Aboneliğiniz aktif değil. Lütfen planınızı güncelleyin.");
    }
    return true;
}

export async function featureGate(ctx: RequestContext, featureKey: string) {
    // 1. Tenant'ın aktif planını bul
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

    // 2. Plan özelliklerini kontrol et
    // PlanFeature tablosunda featureId ile eşleşen bir kayıt var mı?
    // featureKey (örn: 'e_invoice') üzerinden featureId'yi bulmamız lazım veya
    // Feature tablosunda 'key' alanı üzerinden de gidebiliriz.

    // Performans için öneri: Bu feature listesi Redis'te veya Session'da cache'lenebilir.
    // Şimdilik DB'den doğrudan kontrol ediyoruz.

    const hasFeature = subscription.plan.features.some(pf => pf.feature.key === featureKey);

    if (!hasFeature) {
        throw new Error(`FORBIDDEN: Bu özellik (${featureKey}) mevcut planınızda (${subscription.plan.name}) bulunmuyor. Üst pakete geçiş yapınız.`);
    }

    return true;
}

export async function quotaGate(ctx: RequestContext, resourceKey: string) {
    // 1. Plan Limitlerini Getir
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
    // Eğer limit tanımlanmamışsa varsayılan olarak engelle (veya serbest bırak? Güvenlik için engellemek veya 0 demek mantıklı)
    // -1 genellikle sınırsız demektir.
    const limit = limitObj ? limitObj.limit : 0;

    if (limit === -1) return true;

    // 2. Kullanımı Hesapla
    let usage = 0;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    if (resourceKey === 'monthly_documents') {
        // Bu ay kesilen toplam fatura sayısı (e-fatura + e-arşiv)
        // Tenant altındaki company'lerin toplamı, çünkü limit tenant'a aittir.
        const companies = await (prisma as any).company.findMany({
            where: { tenantId: ctx.tenantId },
            select: { id: true }
        });
        const companyIds = companies.map(c => c.id);

        usage = await (prisma as any).salesInvoice.count({
            where: {
                companyId: { in: companyIds },
                isFormal: true, // Sadece resmileşmiş faturalar
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
