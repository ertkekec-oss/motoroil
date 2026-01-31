
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        const { id } = await params;
        const customerId = id;

        if (!customerId) {
            return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
        }

        const customer = await prisma.customer.findUnique({
            where: { id: customerId, deletedAt: null }, // Only fetch if not soft-deleted
            include: {
                transactions: {
                    where: { deletedAt: null },
                    orderBy: { date: 'desc' }
                },
                invoices: {
                    where: { deletedAt: null },
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
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

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
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        // CRITICAL: Check server-side permission
        if (!hasPermission(session, 'delete_records')) {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
        }

        const { id } = await params;

        // SOFT DELETE
        await prisma.customer.update({
            where: { id },
            data: { deletedAt: new Date() }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Customer Delete API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
