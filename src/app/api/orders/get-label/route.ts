import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TrendyolService } from '@/services/marketplaces/trendyol';
import { HepsiburadaService } from '@/services/marketplaces/hepsiburada';
import fs from 'fs';
import path from 'path';

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

        if (marketplace !== 'Trendyol' && marketplace !== 'Hepsiburada') {
            console.error('❌ Desteklenmeyen marketplace:', marketplace);
            return NextResponse.json({ success: false, error: `Currently ${marketplace} labels are not supported.` }, { status: 400 });
        }

        // 1. Siparişi bul (shipmentPackageId lazım)
        console.log('🔍 OrderId alındı:', orderId);
        let shipmentId = orderId;
        let dbOrder = null;

        try {
            dbOrder = await prisma.order.findFirst({
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
                    marketplaceId: dbOrder.marketplaceId,
                    shipmentPackageId: dbOrder.shipmentPackageId
                });
                // Hepsiburada and Trendyol generally use shipmentPackageId if available, fallback to marketplaceId
                shipmentId = dbOrder.shipmentPackageId || dbOrder.marketplaceId;
            } else {
                console.log('⚠️ DB\'de sipariş bulunamadı, orderId direkt kullanılıyor');
            }
        } catch (dbError: any) {
            console.error('❌ Database hatası (order):', dbError.message);
            console.log('⚠️ DB hatası oldu ama orderId ile devam ediliyor');
        }

        console.log('📦 Kullanılacak shipmentId/packageNumber:', shipmentId);

        if (!shipmentId) {
            console.error('❌ ShipmentId boş!');
            return NextResponse.json({
                success: false,
                error: 'Sipariş için shipmentPackageId veya marketplaceId bulunamadı.'
            }, { status: 400 });
        }

        let pdfData: any = null;

        if (marketplace === 'Trendyol') {
            console.log('🔧 Trendyol ayarları çekiliyor...');
            const config = await prisma.marketplaceConfig.findUnique({
                where: { type: 'trendyol' }
            });

            if (!config || !config.isActive) {
                console.error('❌ Trendyol entegrasyonu aktif değil!');
                return NextResponse.json({ success: false, error: 'Trendyol entegrasyonu aktif değil.' }, { status: 400 });
            }

            const settings = config.settings as any;
            if (!settings.supplierId || !settings.apiKey || !settings.apiSecret) {
                console.error('❌ Trendyol API bilgileri eksik!');
                return NextResponse.json({ success: false, error: 'Trendyol API bilgileri eksik.' }, { status: 400 });
            }

            const trendyolService = new TrendyolService({
                supplierId: settings.supplierId,
                apiKey: settings.apiKey,
                apiSecret: settings.apiSecret,
                isTest: settings.isTest
            });

            console.log('📦 Trendyol Etiket çekiliyor, shipmentId:', shipmentId);
            pdfData = await trendyolService.getCommonLabel(shipmentId) as any;

        } else if (marketplace === 'Hepsiburada') {
            console.log('🔧 Hepsiburada ayarları çekiliyor...');
            const config = await prisma.marketplaceConfig.findUnique({
                where: { type: 'hepsiburada' }
            });

            if (!config || !config.isActive) {
                console.error('❌ Hepsiburada entegrasyonu aktif değil!');
                return NextResponse.json({ success: false, error: 'Hepsiburada entegrasyonu aktif değil.' }, { status: 400 });
            }

            const settings = config.settings as any;
            if (!settings.merchantId || !settings.password) {
                console.error('❌ Hepsiburada API bilgileri eksik!');
                return NextResponse.json({ success: false, error: 'Hepsiburada API bilgileri eksik.' }, { status: 400 });
            }

            const hbService = new HepsiburadaService({
                merchantId: settings.merchantId,
                username: settings.username || 'Periodya',
                password: settings.password,
                isTest: settings.isTest
            });

            console.log('📦 Hepsiburada Etiket çekiliyor, packageNumber/shipmentId:', shipmentId);
            const hbLabelRes = await hbService.getCargoLabel(shipmentId);
             
            if (hbLabelRes && !hbLabelRes.error && hbLabelRes.pdfBase64) {
                pdfData = {
                    status: 'SUCCESS',
                    pdfBase64: hbLabelRes.pdfBase64,
                    debug: hbLabelRes
                };
            } else {
                pdfData = {
                    status: 'FAILED',
                    error: hbLabelRes?.error || 'Hepsiburada API etiket verisini döndüremedi.'
                };
            }
        }

        // Debug kopyası kaydet (sadece development'ta işe yarayabilir ama zararsızdır)
        try {
            const debugPath = path.join(process.cwd(), 'etiket_response_debug.txt');
            fs.writeFileSync(debugPath, JSON.stringify(pdfData, null, 2), 'utf8');
            console.log('📝 Dev debug: API Response etiketi etiket_response_debug.txt dosyasına yazıldı.');
        } catch (e) {
            console.error('❌ Debug dosyasına yazılamadı:', e);
        }

        if (!pdfData || pdfData.status !== 'SUCCESS') {
            console.error(`❌ ${marketplace} API etiket döndürmedi. ShipmentId:`, shipmentId, 'Status:', pdfData?.status, 'Error:', pdfData?.error);
            return NextResponse.json({
                success: false,
                error: pdfData?.error || `Etiket bulunamadı. Sipariş ID: ${shipmentId}. Sipariş henüz paketlenmemiş veya etiket oluşturulmamış olabilir.`
            }, { status: pdfData?.status === 'FAILED' ? 400 : 404 });
        }

        console.log('✅ Etiket alındı, status:', pdfData.status);

        // Client'a PDF/Base64 dön
        return NextResponse.json({
            success: true,
            content: pdfData.pdfBase64 || pdfData.zpl,
            format: pdfData.zpl ? 'ZPL' : 'PDF',
            debugPayload: pdfData
        });

    } catch (error: any) {
        console.error('❌❌❌ FATAL ERROR in get-label route:', error);
        console.error('Error stack:', error.stack);
        return NextResponse.json({
            success: false,
            error: `Sunucu hatası: ${error.message || 'Bilinmeyen Hata'}. Lütfen konsol loglarını kontrol edin.`
        }, { status: 500 });
    }
}
