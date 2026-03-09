import prisma from '@/lib/prisma';

export const DEFAULT_KB_CATEGORIES = [
    { name: 'ERP', slug: 'erp', description: 'Genel ERP kullanımı ve ayarları', order: 10 },
    { name: 'Finans', slug: 'finans', description: 'Finans, kasa ve banka işlemleri', order: 20 },
    { name: 'Envanter', slug: 'envanter', description: 'Stok yönetimi ve depo süreçleri', order: 30 },
    { name: 'Satış Yönetimi', slug: 'satis-yonetimi', description: 'Faturalandırma ve satış modülleri', order: 40 },
    { name: 'SalesX', slug: 'salesx', description: 'Saha Satış Performans Motoru', order: 50 },
    { name: 'B2B Hub', slug: 'b2b-hub', description: 'B2B Pazar Yeri işlemleri', order: 60 },
    { name: 'Entegrasyonlar', slug: 'entegrasyonlar', description: 'Harici sistem ve modül entegrasyonları', order: 70 },
    { name: 'E-Fatura', slug: 'e-fatura', description: 'E-Fatura ve e-Arşiv işlemleri', order: 80 },
    { name: 'Kargo', slug: 'kargo', description: 'Lojistik ve sevkiyat süreçleri', order: 90 },
    { name: 'Kullanıcı Yönetimi', slug: 'kullanici-yonetimi', description: 'Rol, yetki ve personel ayarları', order: 100 },
    { name: 'Hesap & Abonelik', slug: 'hesap-abonelik', description: 'Abonelik paketleri ve ödemeler', order: 110 }
];

export class KnowledgeBaseInit {
    /**
     * Seeds the default global categories if they don't exist.
     * Scoped to tenantId = null for GLOBAL categories.
     */
    static async seedDefaultCategories() {
        for (const cat of DEFAULT_KB_CATEGORIES) {
            await prisma.helpCategory.upsert({
                where: { slug: cat.slug },
                update: {
                    name: cat.name,
                    description: cat.description,
                    order: cat.order
                },
                create: {
                    name: cat.name,
                    slug: cat.slug,
                    description: cat.description,
                    order: cat.order,
                    tenantId: null // Global
                }
            });
        }
    }
}
