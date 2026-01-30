import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { data } = body;

        if (!data || !Array.isArray(data)) {
            return NextResponse.json({ success: false, error: 'Geçersiz veri formatı.' }, { status: 400 });
        }

        let successCount = 0;

        for (const item of data) {
            if (item.supplierName && item.invoiceNo) {
                try {
                    // Tedarikçiyi isme göre bul veya yoksa oluştur
                    let supplier = await prisma.supplier.findFirst({
                        where: { name: { equals: item.supplierName, mode: 'insensitive' } }
                    });

                    if (!supplier) {
                        supplier = await prisma.supplier.create({
                            data: { name: item.supplierName }
                        });
                    }

                    // Faturayı oluştur
                    // Excel'den gelen tarihleri parse etmek gerekebilir. 
                    // Excel tarih formatı bazen sayısal (45321 gibi) bazen string gelir.
                    const parseDate = (val: any) => {
                        if (!val) return new Date();
                        const d = new Date(val);
                        return isNaN(d.getTime()) ? new Date() : d;
                    };

                    await prisma.purchaseInvoice.create({
                        data: {
                            invoiceNo: String(item.invoiceNo),
                            invoiceDate: parseDate(item.invoiceDate),
                            dueDate: item.dueDate ? parseDate(item.dueDate) : undefined,
                            amount: parseFloat(item.amount) || 0,
                            taxAmount: parseFloat(item.taxAmount) || 0,
                            totalAmount: parseFloat(item.totalAmount) || 0,
                            description: item.description,
                            supplierId: supplier.id,
                            status: 'Bekliyor'
                        }
                    });

                    // Tedarikçi bakiyesini güncelle (borç ekle)
                    await prisma.supplier.update({
                        where: { id: supplier.id },
                        data: {
                            balance: {
                                decrement: parseFloat(item.totalAmount) || 0
                            }
                        }
                    });

                    successCount++;
                } catch (err) {
                    console.error("Skipped invoice:", item.invoiceNo, err);
                }
            }
        }

        return NextResponse.json({ success: true, count: successCount });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
