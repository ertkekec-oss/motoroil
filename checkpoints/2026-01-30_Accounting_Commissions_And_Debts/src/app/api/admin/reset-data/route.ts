import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { confirmation } = await request.json();

        if (confirmation !== 'ONAYLIYORUM') {
            return NextResponse.json({ success: false, error: 'Onay kodu hatalı. Lütfen "ONAYLIYORUM" yazın.' });
        }

        // 1. Finansal ve Hareket Tablolarını Temizle
        await prisma.transaction.deleteMany({});
        await prisma.check.deleteMany({});
        await prisma.serviceRecord.deleteMany({});
        
        // 2. Faturaları ve Siparişleri Temizle
        await prisma.salesInvoice.deleteMany({});
        await prisma.purchaseInvoice.deleteMany({});
        await prisma.order.deleteMany({});

        // 3. Bekleyen İşlemleri ve Bildirimleri Temizle
        await prisma.pendingProduct.deleteMany({});
        await prisma.pendingTransfer.deleteMany({});
        await prisma.inventoryAudit.deleteMany({});
        await prisma.notification.deleteMany({});
        // await prisma.warranty.deleteMany({}); // Garantiler de silinmeli mi? Genelde evet.

        // 4. Bakiyeleri Sıfırla
        await prisma.customer.updateMany({ data: { balance: 0 } });
        await prisma.supplier.updateMany({ data: { balance: 0 } });
        await prisma.kasa.updateMany({ data: { balance: 0 } });

        // Log
        await prisma.auditLog.create({
            data: {
                action: 'RESET_DATA',
                entity: 'SYSTEM',
                details: 'Tüm finansal veriler, servis kayıtları ve işlem geçmişi admin tarafından sıfırlandı.',
                userName: 'Admin'
            }
        });

        return NextResponse.json({ success: true, message: 'Veriler başarıyla sıfırlandı.' });

    } catch (e: any) {
        console.error("Reset error:", e);
        return NextResponse.json({ success: false, error: e.message || 'Sistem hatası' });
    }
}
