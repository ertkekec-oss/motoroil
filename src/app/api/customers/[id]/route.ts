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
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        const { id } = await params;
        const companyId = session.companyId;

        const isStaff = session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN';
        const assignedCategoryIds = session.assignedCategoryIds || [];

        const where: any = { id, companyId, deletedAt: null };

        // Strict Category Isolation: Staff can only view details of customers in their assigned categories
        if (isStaff && assignedCategoryIds.length > 0) {
            where.categoryId = { in: assignedCategoryIds };
        }

        const customer = await prisma.customer.findFirst({
            where: where,
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
            return NextResponse.json({ success: false, error: 'Müşteri bulunamadı' }, { status: 404 });
        }

        await logActivity({
            tenantId: session.tenantId as string,
            userId: session.id as string,
            userName: session.username as string,
            action: 'VIEW_CUSTOMER',
            entity: 'Customer',
            entityId: id,
            details: `${customer.name} detayı görüntülendi.`,
            branch: session.branch as string
        });

        return NextResponse.json({ success: true, customer });
    } catch (error: any) {
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
        const companyId = session.companyId;
        const body = await request.json();

        // Verify ownership
        const oldCustomer = await prisma.customer.findFirst({
            where: { id, companyId }
        });
        if (!oldCustomer) return NextResponse.json({ success: false, error: 'Müşteri bulunamadı' }, { status: 404 });

        const updatedCustomer = await prisma.customer.update({
            where: { id },
            data: {
                name: body.name,
                // Boş string email'i null'a çevir — unique constraint (email, companyId) çakışmasını önler
                email: (body.email && body.email.trim() !== '') ? body.email.trim() : null,
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
            branch: session.branch as string
        });

        return NextResponse.json({ success: true, customer: updatedCustomer });
    } catch (error: any) {
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
            return NextResponse.json({
                success: false,
                error: 'Bu e-posta adresi bu firmada zaten kayıtlı. Lütfen farklı bir e-posta girin veya e-posta alanını boş bırakın.'
            }, { status: 409 });
        }
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

        if (!hasPermission(session, 'delete_records')) {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
        }

        const { id } = await params;
        const companyId = session.companyId;

        // Verify ownership
        const oldCustomer = await prisma.customer.findFirst({
            where: { id, companyId }
        });
        if (!oldCustomer) return NextResponse.json({ success: false, error: 'Müşteri bulunamadı' }, { status: 404 });

        await prisma.customer.update({
            where: { id },
            data: { deletedAt: new Date() }
        });

        await logActivity({
            tenantId: session.tenantId as string,
            userId: session.id as string,
            userName: session.username as string,
            action: 'DELETE_CUSTOMER',
            entity: 'Customer',
            entityId: id,
            before: oldCustomer,
            details: `${oldCustomer?.name} silindi (Soft Delete).`,
            branch: session.branch as string
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
