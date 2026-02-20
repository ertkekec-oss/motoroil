
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TrendyolService } from '@/services/marketplaces/trendyol';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orderId, platform, cargoCompany } = body;

        // Platform kontrolü (Şimdilik sadece Trendyol'u destekliyoruz)
        if (platform !== 'Trendyol') {
            return NextResponse.json({
                success: true,
                message: `Simülasyon: ${platform} için kargo güncellendi. (Gerçek entegrasyon sadece Trendyol için aktif)`
            });
        }

        // 1. Veritabanından Trendyol ayarlarını çek
        const config = await prisma.marketplaceConfig.findUnique({
            where: { type: 'trendyol' }
        });

        if (!config || !config.isActive) {
            console.error('Trendyol entegrasyonu aktif değil veya ayarlar bulunamadı.');
            return NextResponse.json({
                success: false,
                message: 'Trendyol entegrasyonu aktif değil. Lütfen ayarlardan kontrol edin.'
            }, { status: 400 });
        }

        const settings = config.settings as any;

        // 2. Trendyol Servisini Başlat
        const trendyolService = new TrendyolService({
            supplierId: settings.supplierId,
            apiKey: settings.apiKey,
            apiSecret: settings.apiSecret,
            isTest: settings.isTest || false
        });

        // Trendyol Kargo Kodları Mapping (Updated to Marketplace codes per docs)
        const cargoCodes: Record<string, string> = {
            'Yurtiçi Kargo': 'YKMP',
            'Aras Kargo': 'ARASMP',
            'MNG Kargo': 'MNGMP',
            'Sürat Kargo': 'SURATMP',
            'PTT Kargo': 'PTTMP',
            'Trendyol Express': 'TEXMP',
            'UPS Kargo': 'UPSMP',
            'Horoz Lojistik': 'HOROZMP',
            'Ceva Lojistik': 'CEVAMP',
            'Sendeo': 'SENDEOMP',
            'Hepsijet': 'HEPSIJETMP',
            'Kolay Gelsin': 'KOLAYGELSINMP'
        };

        const cargoCode = cargoCodes[cargoCompany] || cargoCompany; // Use company name if not found in list

        // orderId genellikle veritabanımızdaki ID'dir. Pazaryerindeki ID'yi bulmamız gerekebilir.
        // Ancak bu API'ye gelen `orderId` verisi SalesPage'de `o.id` olarak geçiyor.
        // Eğer o.id 'ORD-...' gibi bizim oluşturduğumuz bir ID ise, gerçek Trendyol ShipmentPackageManagerId'yi bulmalıyız.
        // Bu yüzden Order tablosundan kaydı çekip shipmentId'yi (veya marketplaceId) almalıyız.

        let shipmentPackageId = orderId;

        // Veritabanından siparişi kontrol et (Eğer veritabanında varsa)
        // NOT: SalesPage'de gösterilen veriler bazen API'den canlı çekiliyor olabilir.
        // Eğer orderId 'ORD-' ile başlamıyorsa muhtemelen doğrudan Trendyol ID'sidir.
        // Güvenlik için DB'ye bakayım:
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
            shipmentPackageId = dbOrder.marketplaceId; // Trendyol için bu genellikle Shipment Package ID'dir
        }

        // 3. Trendyol API'sine güncelleme isteği gönder
        const result = await trendyolService.updateCargoProvider(shipmentPackageId, cargoCode);

        if (result.success) {
            // 4. Başarılıysa veritabanını da güncelle
            try {
                await prisma.order.updateMany({
                    where: {
                        OR: [
                            { id: orderId },
                            { orderNumber: orderId },
                            { marketplaceId: orderId }
                        ]
                    },
                    data: {
                        cargoProvider: cargoCompany
                    }
                });
            } catch (dbError) {
                console.error('Database update error (non-critical):', dbError);
                // DB hatası kritik değil, Trendyol'da güncellendi
            }

            return NextResponse.json({
                success: true,
                message: `✅ Trendyol siparişi (${shipmentPackageId}) için kargo firması ${cargoCompany} olarak güncellendi.`
            });
        } else {
            console.error(`Trendyol Update Error for ${shipmentPackageId}:`, result.error);
            return NextResponse.json({
                success: false,
                message: `Trendyol API Hatası: ${result.error}`
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Kargo güncelleme endpoint hatası:', error);
        return NextResponse.json({ success: false, message: 'Sunucu hatası oluştu.' }, { status: 500 });
    }
}
