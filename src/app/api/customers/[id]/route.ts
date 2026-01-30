
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

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, email, phone, address, taxNumber, taxOffice, contactPerson, iban, categoryId, supplierClass, customerClass, branch } = body;

        const updatedCustomer = await prisma.customer.update({
            where: { id },
            data: {
                name,
                email,
                phone,
                address,
                taxNumber,
                taxOffice,
                contactPerson,
                iban,
                categoryId,
                supplierClass,
                customerClass,
                branch
            }
        });

        return NextResponse.json({ success: true, customer: updatedCustomer });
    } catch (error: any) {
        console.error('Customer Update API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Check if there are transactions or invoices
        const countTrans = await prisma.transaction.count({ where: { customerId: id } });
        const countInvoices = await prisma.salesInvoice.count({ where: { customerId: id } });

        if (countTrans > 0 || countInvoices > 0) {
            return NextResponse.json({
                success: false,
                error: 'Bu müşterinin işlem geçmişi (fatura veya finansal hareket) olduğu için silinemez. Önce ilişkili kayıtları silmelisiniz.'
            }, { status: 400 });
        }

        await prisma.customer.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Customer Delete API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
