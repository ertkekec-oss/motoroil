
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        const body = await request.json();
        const { type, customerId, supplierId, irsNo, date, items, description } = body;

        if (type === 'Giden') {
            const wayslip = await prisma.salesInvoice.create({
                data: {
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
                    description: description || 'Sevk İrsaliyesi'
                }
            });
            return NextResponse.json({ success: true, wayslip });
        } else {
            const wayslip = await prisma.purchaseInvoice.create({
                data: {
                    invoiceNo: irsNo || `IRS-G-${Date.now()}`,
                    supplierId,
                    invoiceDate: new Date(date),
                    amount: items.reduce((acc: number, item: any) => acc + (item.price || 0) * item.qty, 0),
                    totalAmount: items.reduce((acc: number, item: any) => acc + (item.price || 0) * item.qty, 0),
                    items: items,
                    status: 'İrsaliye',
                    description: description || 'Alım İrsaliyesi'
                }
            });
            return NextResponse.json({ success: true, wayslip });
        }
    } catch (error: any) {
        console.error('Wayslip Creation Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
