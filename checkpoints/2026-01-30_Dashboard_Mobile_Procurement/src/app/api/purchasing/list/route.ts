
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const invoices = await prisma.purchaseInvoice.findMany({
            include: {
                supplier: true
            },
            orderBy: {
                invoiceDate: 'desc'
            }
        });

        // Map to UI format
        const formatted = invoices.map(inv => ({
            id: inv.invoiceNo,
            supplier: inv.supplier.name,
            date: inv.invoiceDate.toLocaleDateString('tr-TR'),
            msg: inv.description || `${(inv.items as any[])?.length || 0} Kalem Ürün Girişi`,
            total: inv.totalAmount,
            status: inv.status === 'Bekliyor' ? 'Bekliyor' : 'Onaylandı',
            target: 'Merkez Depo' // Simplification
        }));

        return NextResponse.json({ success: true, invoices: formatted });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
