import { PrismaClient } from '@prisma/client';
import prisma from '@/lib/prisma';

export interface SecurityContext {
    tenantId: string;
    companyId?: string | null;
    userId?: string | null;
    role?: string | null;
    isPlatformAdmin?: boolean;
}

// 1) MODEL Sınıflandırması
export const ModelScopes = {
    // Her zaman Tenant filtresi ZORUNLU olan modeller (Mutlak izolasyon)
    TENANT_SCOPED: [
        'reconciliation',
        'reconciliationdocument',
        'reconciliationdispute',
        'salesinvoice',
        'purchaseinvoice',
        'transaction',
        'kasa',
        'auditevent',
        'securityevent'
    ],
    // Tenant harici kasten "companyId" zorunlu kılınan modeller
    COMPANY_SCOPED: [
        'product',
        'productvariant',
        'stock',
        'stockmovement',
        'staff',
        'companydocument',
        'employeedocument',
        'exportreport',
        'branch',
        'warehouse',
        'depot',
        'cashbox',
        'appsettings', // company settings
        'company'
    ],
    // Shared Visibility (Ortak Görünürlük) - Tenant filtresi her zaman direkt eklenmeyebilir,
    // özel kurallara tabidir (Örn: alıcı ve satıcı tenant'ı farklı olan siparişler)
    SHARED_VISIBILITY: [
        'contract',
        'contractdocument',
        'networkorder',
        'networkoffer',
        'networkdemand',
        'shipment',
        'dealermembership'
    ],
    // Platform bazlı, global (Tenant filtresi olmaz)
    PLATFORM_GLOBAL: [
        'user', // Kullanıcılar sistem geneli olabilir, yetkileri pivot tabloda tutulur
        'tenant',
        'plan',
        'subscription',
        'helpcategory',
        'helptopic'
    ]
};

/**
 * createScopedDb
 * 
 * Bu fonksiyon, geliştiricinin Prisma üzerinde kasti veya yanlışlıkla
 * tenant filtresini (where: { tenantId }) unutmasını engelleyen
 * esnek bir Proxy sarmalayıcısıdır. Geleneksel Prisma `$extends` mimarisindeki
 * bellek sızıntılarını önler.
 */
export function createScopedDb(ctx: SecurityContext, db: PrismaClient | any = prisma) {
    if (!ctx.tenantId && !ctx.isPlatformAdmin) {
        throw new Error("SECURITY_ERROR: Scoped DB oluşturulurken tenantId eksik!");
    }

    const handler: ProxyHandler<any> = {
        get(target, prop: string) {
            // Prisma'nın kendi dahili değişkenleri ($transaction, $connect vb.)
            if (prop.startsWith('$') || prop === 'then' || prop === 'catch') {
                return Reflect.get(target, prop);
            }

            const modelName = prop;
            const modelDelegate = target[modelName];

            if (!modelDelegate) return undefined;

            return new Proxy(modelDelegate, {
                get(modelTarget, op: string) {
                    const originalMethod = modelTarget[op];
                    if (typeof originalMethod !== 'function') {
                        return Reflect.get(modelTarget, op);
                    }

                    return async (args: any = {}) => {
                        // Platform yetkililerine tam erişim (isteğe bağlı)
                        if (ctx.isPlatformAdmin) {
                            return originalMethod.call(modelTarget, args);
                        }

                        const lowerModelName = modelName.toLowerCase();

                        // İşlem tipi
                        const isRead = ['findMany', 'findFirst', 'findUnique', 'count', 'aggregate', 'groupBy'].includes(op);
                        const isUpdate = ['update', 'updateMany', 'delete', 'deleteMany'].includes(op);
                        const isCreate = ['create', 'createMany', 'upsert'].includes(op);

                        // 1. TENANT SCOPED İZOLASYONU
                        if (ModelScopes.TENANT_SCOPED.map(m => m.toLowerCase()).includes(lowerModelName)) {
                            // Read / Update işlemleri için WHERE içine tenantId enjekte et
                            if (isRead || isUpdate) {
                                args.where = args.where || {};

                                // findUnique ilişkisel tenant check gerektirdiğinden findFirst'e çevirmemiz tavsiye edilir
                                // Ancak Prisma schema extension seviyesinde bu çevrildiği için burada sadece objeyi doğruluyoruz
                                if (op === 'findUnique') {
                                    // Eğer geliştirici id bazlı bir arama yapıyorsa, ve tenantId yoksa Prisma hata verir.
                                    // Geliştirici artık findFirst kullanmaya zorlanmalı.
                                    if (!args.where.tenantId) {
                                        args.where.tenantId = ctx.tenantId;
                                    }
                                } else {
                                    args.where.tenantId = ctx.tenantId;
                                }

                                if (ModelScopes.COMPANY_SCOPED.map(m => m.toLowerCase()).includes(lowerModelName) && ctx.companyId) {
                                    args.where.companyId = ctx.companyId;
                                }
                            }

                            // Create işlemleri için DATA içine tenantId enjekte et
                            if (isCreate) {
                                if (op === 'createMany') {
                                    const dataArr = Array.isArray(args.data) ? args.data : [args.data];
                                    args.data = dataArr.map((d: any) => ({
                                        ...d,
                                        tenantId: ctx.tenantId,
                                        ...(ModelScopes.COMPANY_SCOPED.map(m => m.toLowerCase()).includes(lowerModelName) && ctx.companyId ? { companyId: ctx.companyId } : {})
                                    }));
                                } else if (op === 'create' || op === 'upsert') {
                                    const dataPayload = op === 'upsert' ? args.create : args.data;
                                    if (dataPayload) {
                                        dataPayload.tenantId = ctx.tenantId;
                                        if (ModelScopes.COMPANY_SCOPED.map(m => m.toLowerCase()).includes(lowerModelName) && ctx.companyId) {
                                            dataPayload.companyId = ctx.companyId;
                                        }
                                    }
                                    // Aynı şekilde upsert'in where koşuluna da izolasyon eklenebilir
                                    if (op === 'upsert') {
                                        args.where = args.where || {};
                                        args.where.tenantId = ctx.tenantId;
                                    }
                                }
                            }
                        }

                        // 2. SHARED VISIBILITY (Ağ Modelleri vs.)
                        if (ModelScopes.SHARED_VISIBILITY.map(m => m.toLowerCase()).includes(lowerModelName)) {
                            // Sadece okumalarda Buyer veya Seller olduğundan emin ol
                            if (isRead && ctx.companyId) {
                                args.where = args.where || {};
                                const networkCondition = {
                                    OR: [
                                        { buyerCompanyId: ctx.companyId },
                                        { sellerCompanyId: ctx.companyId }
                                    ]
                                };

                                if (Object.keys(args.where).length === 0) {
                                    Object.assign(args.where, networkCondition);
                                } else {
                                    if (args.where.AND) {
                                        args.where.AND = Array.isArray(args.where.AND)
                                            ? [...args.where.AND, networkCondition]
                                            : [args.where.AND, networkCondition];
                                    } else {
                                        args.where.AND = [networkCondition];
                                    }
                                }
                            }
                        }

                        // Orijinal Prisma fonksiyonunu modifiye edilmiş args ile çağır
                        return originalMethod.call(modelTarget, args);
                    };
                }
            });
        }
    };

    return new Proxy(db, handler);
}
