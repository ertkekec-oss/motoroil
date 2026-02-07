import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission, verifyWriteAccess } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

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
            where: { id: customerId, deletedAt: null },
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

        // Log the view action
        await logActivity({
            tenantId: session.tenantId as string,
            userId: session.id as string,
            userName: session.username as string,
            action: 'VIEW_CUSTOMER',
            entity: 'Customer',
            entityId: customerId,
            details: `${customer.name} detayı görüntülendi.`,
            branch: session.branch as string,
            userAgent: request.headers.get('user-agent') || undefined,
            ipAddress: request.headers.get('x-forwarded-for') || '0.0.0.0'
        });

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
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        const writeCheck = verifyWriteAccess(session);
        if (!writeCheck.authorized) return writeCheck.response;

        const { id } = await params;
        const body = await request.json();

        // Fetch old data for audit log
        const oldCustomer = await prisma.customer.findUnique({ where: { id } });

        const updatedCustomer = await prisma.customer.update({
            where: { id },
            data: {
                name: body.name,
                email: body.email,
                phone: body.phone,
                address: body.address,
                city: body.city,
                district: body.district,
                taxNumber: body.taxNumber,
                taxOffice: body.taxOffice,
                contactPerson: body.contactPerson,
                iban: body.iban,
                categoryId: body.categoryId,
                supplierClass: body.supplierClass,
                customerClass: body.customerClass,
                branch: body.branch
            }
        });

        // Log the update action
        await logActivity({
            tenantId: session.tenantId as string,
            userId: session.id as string,
            userName: session.username as string,
            action: 'UPDATE_CUSTOMER',
            entity: 'Customer',
            entityId: id,
            before: oldCustomer,
            after: updatedCustomer,
            details: `${updatedCustomer.name} bilgileri güncellendi.`,
            branch: session.branch as string,
            userAgent: request.headers.get('user-agent') || undefined,
            ipAddress: request.headers.get('x-forwarded-for') || '0.0.0.0'
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
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        const writeCheck = verifyWriteAccess(session);
        if (!writeCheck.authorized) return writeCheck.response;

        // CRITICAL: Check server-side permission
        if (!hasPermission(session, 'delete_records')) {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
        }

        const { id } = await params;

        // Fetch old data for audit log
        const oldCustomer = await prisma.customer.findUnique({ where: { id } });

        // SOFT DELETE
        await prisma.customer.update({
            where: { id },
            data: { deletedAt: new Date() }
        });

        // Log the delete action
        await logActivity({
            tenantId: session.tenantId as string,
            userId: session.id as string,
            userName: session.username as string,
            action: 'DELETE_CUSTOMER',
            entity: 'Customer',
            entityId: id,
            before: oldCustomer,
            details: `${oldCustomer?.name} silindi (Soft Delete).`,
            branch: session.branch as string,
            userAgent: request.headers.get('user-agent') || undefined,
            ipAddress: request.headers.get('x-forwarded-for') || '0.0.0.0'
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Customer Delete API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
