
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const session: any = await getSession();
        if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.role?.toUpperCase())) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Migration: Fix keys to match frontend expectations
        try {
            const oldFinance = await prisma.feature.findUnique({ where: { key: 'finance' } });
            const newAccounting = await prisma.feature.findUnique({ where: { key: 'accounting' } });
            if (oldFinance && !newAccounting) {
                await prisma.feature.update({ where: { key: 'finance' }, data: { key: 'accounting' } });
            }

            const oldEinvoice = await prisma.feature.findUnique({ where: { key: 'einvoice' } });
            const newEInvoice = await prisma.feature.findUnique({ where: { key: 'e_invoice' } });
            if (oldEinvoice && !newEInvoice) {
                await prisma.feature.update({ where: { key: 'einvoice' }, data: { key: 'e_invoice' } });
            }
        } catch (e) {
            console.log('Feature key migration skipped or failed:', e);
        }

        const currentFeatures = [
            { key: 'pos', name: '🏮 POS Terminal', description: 'Hızlı satış, fiş kesme ve kasa yönetimi.' },
            { key: 'financials', name: '🏛️ Finansal Yönetim', description: 'Gider takibi, kasa/banka yönetimi ve nakit akışı.' },
            { key: 'sales', name: '🧾 Satış Yönetimi', description: 'Satış faturaları, iade süreçleri ve satış raporları.' },
            { key: 'current_accounts', name: '🤝 Cari Hesaplar', description: 'Müşteri borç/alacak takibi ve risk yönetimi.' },
            { key: 'suppliers', name: '🚚 Tedarikçi Ağı', description: 'Tedarikçi yönetimi, alım faturaları ve ödeme takibi.' },
            { key: 'fintech_tower', name: '🗼 Finansal Kontrol Kulesi', description: 'Merkezi finansal denetim ve operasyonel takip.' },
            { key: 'smart_pricing', name: '🤖 Otonom Fiyatlandırma', description: 'Yapay zeka destekli dinamik fiyatlandırma sistemi.' },
            { key: 'pnl_heatmap', name: '🔥 Kârlılık Isı Haritası', description: 'Ürün ve kategori bazlı anlık kârlılık görselleştirmesi.' },
            { key: 'inventory', name: '📥 Envanter & Depo', description: 'Stok takibi, depo transferleri ve sayım işlemleri.' },
            { key: 'field_sales', name: '🗺️ Saha Satış Yönetimi', description: 'Plasiyer takibi, rota yönetimi ve saha sipariş toplama.' },
            { key: 'quotes', name: '📋 Teklifler', description: 'Proforma fatura ve müşteri teklif yönetimi.' },
            { key: 'service_desk', name: '🛠️ Servis Masası', description: 'Teknik servis kayıtları, iş emri ve parça takibi.' },
            { key: 'analytics', name: '📊 Veri Analizi', description: 'Gelişmiş kârlılık analizleri ve performans raporları.' },
            { key: 'ceo_intel', name: '🧠 İş Zekası (CEO)', description: 'Üst düzey yönetici performans özetleri ve gelecek projeksiyonları.' },
            { key: 'audit_logs', name: '🔍 Denetim Kayıtları', description: 'Tüm hassas işlemlerin detaylı log takibi ve denetimi.' },
            { key: 'leakage_detection', name: '🚨 Kaçak Satış Tespit', description: 'Şüpheli işlem analizi ve satış güvenliği.' },
            { key: 'accountant', name: '💼 Mali Müşavir', description: 'Müşavir paneli erişimi ve beyanname hazırlık verileri.' },
            { key: 'system_settings', name: '⚙️ Sistem Ayarları', description: 'Platform ve firma bazlı genel konfigürasyonlar.' },
            { key: 'team_management', name: '👥 Ekip & Yetki', description: 'Gelişmiş kullanıcı rolleri ve granular yetkilendirme sistemi.' },
            { key: 'e_invoice', name: '🧾 E-Fatura Entegrasyonu', description: 'GİB uyumlu E-Fatura ve E-Arşiv fatura entegrasyonu.' },
            { key: 'marketplaces', name: '🏪 Pazaryeri Entegrasyonu', description: 'Trendyol, Hepsiburada, Amazon pazaryeri yönetimi.' },
            { key: 'ecommerce', name: '🌐 E-Ticaret Entegrasyonu', description: 'Web sitesi siparişleri ve stok senkronizasyonu.' }
        ];

        // Sync features (Upsert all)
        for (const feat of currentFeatures) {
            await prisma.feature.upsert({
                where: { key: feat.key },
                update: { name: feat.name, description: feat.description },
                create: feat
            });
        }

        // Return the fresh list
        const features = await prisma.feature.findMany({
            where: {
                key: { in: currentFeatures.map(f => f.key) }
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(features);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session: any = await getSession();
        if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.role?.toUpperCase())) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { key, name, description } = body;

        if (!key || !name) {
            return NextResponse.json({ error: 'Key ve isim zorunludur' }, { status: 400 });
        }

        const feature = await prisma.feature.create({
            data: { key, name, description }
        });

        return NextResponse.json({ success: true, feature });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
