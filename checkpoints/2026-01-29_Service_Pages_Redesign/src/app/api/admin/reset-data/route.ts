import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { confirmation } = await request.json();

        if (confirmation !== 'ONAYLIYORUM') {
            return NextResponse.json({ success: false, error: 'Onay kodu hatalı. Lütfen "ONAYLIYORUM" yazın.' });
        }

        // 1. Transactions tablosunu temizle
        await prisma.transaction.deleteMany({});

        // 2. Faturaları temizle
        await prisma.salesInvoice.deleteMany({});
        await prisma.purchaseInvoice.deleteMany({});

        // 3. Siparişleri temizle
        await prisma.order.deleteMany({});

        // 4. Bakiyeleri Sıfırla
        await prisma.customer.updateMany({ data: { balance: 0 } });
        await prisma.supplier.updateMany({ data: { balance: 0 } });
        await prisma.kasa.updateMany({ data: { balance: 0 } });

        // Log
        await prisma.auditLog.create({
            data: {
                action: 'RESET_DATA',
                entity: 'SYSTEM',
                details: 'Tüm finansal veriler ve işlem geçmişi admin tarafından sıfırlandı.',
                userName: 'Admin'
            }
        });

        return NextResponse.json({ success: true, message: 'Veriler başarıyla sıfırlandı.' });

    } catch (e: any) {
        console.error("Reset error:", e);
        return NextResponse.json({ success: false, error: e.message || 'Sistem hatası' });
    }
}
