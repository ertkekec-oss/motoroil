
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        const { id } = await context.params;

        const invoice = await prisma.purchaseInvoice.findFirst({
            where: {
                OR: [
                    { id: id },
                    { invoiceNo: id }
                ]
            }
        });

        if (!invoice) {
            return NextResponse.json({ success: false, error: 'Fatura bulunamadı.' }, { status: 404 });
        }

        if (invoice.status === 'Onaylandı') {
            return NextResponse.json({ success: false, error: 'Onaylanmış fatura reddedilemez.' }, { status: 400 });
        }

        await prisma.purchaseInvoice.update({
            where: { id: invoice.id },
            data: {
                status: 'Reddedildi'
            }
        });

        return NextResponse.json({ success: true, message: 'Fatura reddedildi.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
