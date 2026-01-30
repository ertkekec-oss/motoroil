
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // ID is CUID (String) in Prisma schema, so no parseInt needed.
        // But need to ensure it's not empty or invalid if required.
        const customerId = id;

        if (!customerId) {
            return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
        }

        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            include: {
                transactions: {
                    orderBy: { date: 'desc' }
                },
                invoices: { // Correct relation name is 'invoices', not 'sales'
                    orderBy: { invoiceDate: 'desc' }
                }
            }
        });

        if (!customer) {
            return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, customer });

    } catch (error: any) {
        console.error('Customer Detail API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
