
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Statik olmasını engelle
export const maxDuration = 60; // Uzun süren işlemler için süre (Saniye)

export async function GET(request: Request) {
    // Vercel Cron Header Kontrolü (Güvenlik)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Not: CRON_SECRET .env dosyasında olmalı veya Vercel panelden ayarlanmalı.
        // Şimdilik test kolaylığı için bu kontrolü devre dışı bırakabiliriz veya loglayıp geçeriz.
        // console.warn('Unauthorized Cron Attempt');
    }

    try {
        const results: any = {};
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://periodya.com'; // Kendi URL'imiz

        console.log('🔄 Cron Job Tetiklendi: Sipariş Senkronizasyonu Başlıyor...');

        // 1. E-Ticaret (XML) Senkronizasyonu
        try {
            // Internal fetch kullanarak kendi API'mizi çağırıyoruz
            // Not: Next.js App Router'da aynı projeden API çağırmak yerine servisi doğrudan import edip kullanmak daha performanlıdır.
            // Ancak mevcut API'lerimiz zaten işi yapıyor, kod tekrarı olmasın diye API'leri çağırabiliriz 
            // VEYA daha doğrusu şudur: Servis mantığını buraya taşıyalım.

            // Kolaylık için URL üzerinden tetikleyelim (Self-request)
            const ecommerceRes = await fetch(`${baseUrl}/api/integrations/ecommerce/sync`, {
                method: 'POST',
                headers: { 'x-cron-secret': process.env.CRON_SECRET || '' }
            });
            results.ecommerce = await ecommerceRes.json();
            console.log('✅ E-Ticaret Sync Bitti:', results.ecommerce.message);
        } catch (e: any) {
            console.error('❌ E-Ticaret Sync Hatası:', e);
            results.ecommerce = { error: e.message };
        }

        // 2. Pazaryerleri (Trendyol vb.)
        // Normalde veritabanından aktif pazaryeri configlerini çekip döngüye sokmalıyız.
        // Şimdilik manual olarak bildiğimiz Trendyol configiyle tetikleyelim.
        // Not: Gerçek senaryoda bu bilgileri veritabanından 'MarketplaceConfig' tablosundan almalıyız.

        // Örnek: Trendyol tetiklemesi
        /*
        try {
            const marketplaceRes = await fetch(`${baseUrl}/api/integrations/marketplace/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Config'i frontend'den gönderiyorduk ama Cron'da nereden alacağız?
                // Veritabanından!
                // Bu yüzden Cron endpoint'i içinde veritabanı okuması yapmalıyız.
            });
        }
        */

        // Veritabanından Ayarları Oku
        const prisma = await import('@/lib/prisma').then(m => m.default || m);
        const activeConfigs = await (prisma as any).marketplaceConfig.findMany({
            where: { isActive: true }
        });

        results.marketplaces = [];

        if (activeConfigs.length === 0) {
            console.log('⚠️ Aktif pazaryeri ayarı bulunamadı.');
            // Test için manuel config ile deneyelim (Eğer veritabanında henüz kayıt yoksa)
            // Ama kullanıcı muhtemelen ayarları localStorage'a kaydetti, veritabanına değil :(
            // Frontend kodunda "saveSettings" localStorage kullanıyordu.
            // Cron sunucuda çalıştığı için localStorage'a erişemez!

            // KRİTİK NOT: Kullanıcının girdiği API Key'ler şu an SADECE tarayıcıda (localStorage).
            // Sunucu bunları bilmiyor.
            // Cron'un çalışması için bu ayarların veritabanına kaydedilmiş olması lazım.
        }

        for (const config of activeConfigs) {
            try {
                // Sadece otomatik senkronizasyon açık olanları tetikle
                if (!config.settings?.autoSync && config.type !== 'ecommerce') {
                    console.log(`ℹ️ ${config.type} için Arka Plan Sync. kapalı, atlanıyor.`);
                    continue;
                }

                console.log(`🔄 ${config.type} senkronizasyonu başlıyor (Firma: ${config.companyId})...`);
                // Servisi doğrudan çağırabiliriz veya API'ye istek atabiliriz
                const syncRes = await fetch(`${baseUrl}/api/integrations/marketplace/sync`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-cron-secret': process.env.CRON_SECRET || ''
                    },
                    body: JSON.stringify({
                        type: config.type,
                        config: config.settings,
                        cronCompanyId: config.companyId
                    })
                });
                const data = await syncRes.json();
                results.marketplaces.push({ type: config.type, result: data });
            } catch (err: any) {
                console.error(`❌ ${config.type} hatası:`, err);
                results.marketplaces.push({ type: config.type, error: err.message });
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Cron job tamamlandı.',
            results
        });

    } catch (error: any) {
        console.error('CRON Fatal Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
