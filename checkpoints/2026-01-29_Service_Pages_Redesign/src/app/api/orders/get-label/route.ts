
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TrendyolService } from '@/services/marketplaces/trendyol';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    console.log('🚀 GET /api/orders/get-label - Request başladı');

    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');
        const marketplace = searchParams.get('marketplace');

        console.log('📥 Parametreler:', { orderId, marketplace });

        if (!orderId) {
            console.error('❌ OrderId eksik!');
            return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
        }

        if (marketplace !== 'Trendyol') {
            console.error('❌ Desteklenmeyen marketplace:', marketplace);
            return NextResponse.json({ success: false, error: 'Currently only Trendyol labels are supported.' }, { status: 400 });
        }

        // 1. Ayarları Çek
        console.log('🔧 Trendyol ayarları çekiliyor...');
        let config;
        try {
            config = await prisma.marketplaceConfig.findUnique({
                where: { type: 'trendyol' }
            });
            console.log('✅ Config bulundu:', config ? 'Var' : 'Yok', config?.isActive ? '(Aktif)' : '(Pasif)');
        } catch (dbError: any) {
            console.error('❌ Database hatası (config):', dbError.message);
            return NextResponse.json({
                success: false,
                error: `Database bağlantı hatası: ${dbError.message}. Lütfen veritabanı bağlantısını kontrol edin.`
            }, { status: 500 });
        }

        if (!config || !config.isActive) {
            console.error('❌ Trendyol entegrasyonu aktif değil!');
            return NextResponse.json({
                success: false,
                error: 'Trendyol entegrasyonu aktif değil. Lütfen Entegrasyonlar sayfasından Trendyol ayarlarını yapılandırın.'
            }, { status: 400 });
        }

        const settings = config.settings as any;
        console.log('🔑 Trendyol ayarları:', {
            supplierId: settings.supplierId ? 'Var' : 'Yok',
            apiKey: settings.apiKey ? 'Var' : 'Yok',
            apiSecret: settings.apiSecret ? 'Var' : 'Yok',
            isTest: settings.isTest
        });

        if (!settings.supplierId || !settings.apiKey || !settings.apiSecret) {
            console.error('❌ Trendyol API bilgileri eksik!');
            return NextResponse.json({
                success: false,
                error: 'Trendyol API bilgileri eksik. Lütfen Entegrasyonlar sayfasından Supplier ID, API Key ve API Secret bilgilerini girin.'
            }, { status: 400 });
        }

        const trendyolService = new TrendyolService({
            supplierId: settings.supplierId,
            apiKey: settings.apiKey,
            apiSecret: settings.apiSecret,
            isTest: settings.isTest
        });

        // 2. Siparişi bul (shipmentPackageId lazım)
        console.log('🔍 OrderId alındı:', orderId);
        let shipmentId = orderId;

        try {
            const dbOrder = await prisma.order.findFirst({
                where: {
                    OR: [
                        { id: orderId },
                        { orderNumber: orderId },
                        { marketplaceId: orderId }
                    ]
                }
            });

            if (dbOrder) {
                console.log('✅ DB\'de sipariş bulundu:', {
                    id: dbOrder.id,
                    orderNumber: dbOrder.orderNumber,
                    marketplaceId: dbOrder.marketplaceId
                });
                shipmentId = dbOrder.marketplaceId;
            } else {
                console.log('⚠️ DB\'de sipariş bulunamadı, orderId direkt kullanılıyor');
            }
        } catch (dbError: any) {
            console.error('❌ Database hatası (order):', dbError.message);
            // DB hatası olsa bile devam et, orderId'yi kullan
            console.log('⚠️ DB hatası oldu ama orderId ile devam ediliyor');
        }

        console.log('📦 Kullanılacak shipmentId:', shipmentId);

        if (!shipmentId) {
            console.error('❌ ShipmentId boş!');
            return NextResponse.json({
                success: false,
                error: 'Sipariş için Trendyol shipmentPackageId bulunamadı. Sipariş veritabanında eksik olabilir.'
            }, { status: 400 });
        }

        // 3. Etiketi Çek
        console.log('📦 Etiket çekiliyor, shipmentId:', shipmentId);
        const pdfData = await trendyolService.getCommonLabel(shipmentId);

        if (!pdfData) {
            console.error('❌ Trendyol API etiket döndürmedi. ShipmentId:', shipmentId);
            return NextResponse.json({
                success: false,
                error: `Etiket bulunamadı. Sipariş ID: ${shipmentId}. Sipariş henüz paketlenmemiş veya etiket oluşturulmamış olabilir.`
            }, { status: 404 });
        }

        console.log('✅ Etiket alındı, boyut:', pdfData.length);

        // 4. Client'a PDF/Base64 dön
        return NextResponse.json({ success: true, content: pdfData, format: 'PDF' });

    } catch (error: any) {
        console.error('❌❌❌ FATAL ERROR in get-label route:', error);
        console.error('Error stack:', error.stack);
        return NextResponse.json({
            success: false,
            error: `Sunucu hatası: ${error.message}. Lütfen konsol loglarını kontrol edin.`
        }, { status: 500 });
    }
}
