
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
        const companyId = session.user?.companyId || (session as any).companyId;

        const body = await request.json();
        const { type, customerId, supplierId, irsNo, date, items, description, relatedInvoiceId, relatedInvoiceNo } = body;

        let finalDescription = description || (type === 'Giden' ? 'Sevk İrsaliyesi' : 'Alım İrsaliyesi');
        if (relatedInvoiceNo && relatedInvoiceNo.trim() !== '') {
            finalDescription += ` - Fatura Ref: ${relatedInvoiceNo}`;
        }

        if (type === 'Giden') {
            const wayslip = await prisma.salesInvoice.create({
                data: {
                    companyId,
                    invoiceNo: irsNo || `IRS-${Date.now()}`,
                    customerId,
                    invoiceDate: new Date(date),
                    amount: items.reduce((acc: number, item: any) => acc + (item.price || 0) * item.qty, 0),
                    taxAmount: 0,
                    totalAmount: items.reduce((acc: number, item: any) => acc + (item.price || 0) * item.qty, 0),
                    items: items,
                    status: 'İrsaliye',
                    isFormal: false,
                    branch: (session.branch as string) || 'Merkez',
                    description: finalDescription,
                    orderId: relatedInvoiceId || undefined // We use orderId as a loose reference to the related invoice ID
                }
            });

            // Also update the related invoice to indicate it has been waybilled
            if (relatedInvoiceId) {
                const parentInv = await prisma.salesInvoice.findUnique({where: {id: relatedInvoiceId}});
                if (parentInv && !(parentInv.description || '').includes('[İrsaliyeli]')) {
                     await prisma.salesInvoice.update({
                         where: { id: relatedInvoiceId },
                         data: { description: `[İrsaliyeli] ${parentInv.description || ''}`.trim() }
                     });
                }
            }

            return NextResponse.json({ success: true, wayslip });
        } else {
            const wayslip = await prisma.purchaseInvoice.create({
                data: {
                    companyId,
                    invoiceNo: irsNo || `IRS-G-${Date.now()}`,
                    supplierId,
                    invoiceDate: new Date(date),
                    amount: items.reduce((acc: number, item: any) => acc + (item.price || 0) * item.qty, 0),
                    totalAmount: items.reduce((acc: number, item: any) => acc + (item.price || 0) * item.qty, 0),
                    items: items,
                    status: 'İrsaliye',
                    description: finalDescription
                }
            });
            return NextResponse.json({ success: true, wayslip });
        }
    } catch (error: any) {
        console.error('Wayslip Creation Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
