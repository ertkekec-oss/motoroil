
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const supplier = await prisma.supplier.findUnique({
            where: { id },
            include: {
                invoices: {
                    orderBy: {
                        invoiceDate: 'desc'
                    }
                },
                transactions: {
                    include: { kasa: true },
                    orderBy: {
                        date: 'desc'
                    }
                }
            }
        });

        if (!supplier) {
            return NextResponse.json({ success: false, error: 'Tedarikçi bulunamadı.' }, { status: 404 });
        }

        return NextResponse.json({ success: true, supplier });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
