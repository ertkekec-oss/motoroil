
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
    try {
        const session: any = await getSession();
        if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.role?.toUpperCase())) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id: tenantId } = await paramsPromise;

        const tenant = await (prisma as any).tenant.findUnique({
            where: { id: tenantId },
            include: {
                subscription: {
                    include: {
                        plan: {
                            include: { features: { include: { feature: true } }, limits: true }
                        }
                    }
                },
                companies: {
                    include: {
                        integratorSettings: true
                    }
                },
                users: {
                    select: { id: true, role: true, email: true, createdAt: true }
                }
            }
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        // Detaylı Kullanım İstatistikleri
        // Son 6 ay invoice trendi vb. eklenebilir.
        // Hız için şimdilik temel snapshot.

        const invoiceCount = await (prisma as any).salesInvoice.count({
            where: {
                companyId: { in: tenant.companies.map((c: any) => c.id) },
                isFormal: true,
                createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
            }
        });

        const totalInvoices = await (prisma as any).salesInvoice.count({
            where: {
                companyId: { in: tenant.companies.map((c: any) => c.id) },
                isFormal: true
            }
        });

        // Subscription History
        const subHistory = await (prisma as any).subscriptionHistory.findMany({
            where: { subscriptionId: tenant.subscription?.id },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        // External Requests (Son hatalar)
        const invoices = await (prisma as any).salesInvoice.findMany({
            where: { companyId: { in: tenant.companies.map((c: any) => c.id) } },
            select: { id: true },
            take: 100
        });

        const recentErrors = await (prisma as any).externalRequest.findMany({
            where: {
                entityId: { in: invoices.map((i: any) => i.id) },
                status: 'FAILED'
            },
            orderBy: { updatedAt: 'desc' },
            take: 5
        });


        return NextResponse.json({
            tenant,
            usage: {
                currentMonthInvoices: invoiceCount,
                totalAllTimeInvoices: totalInvoices
            },
            history: subHistory,
            errors: recentErrors
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
    try {
        const session: any = await getSession();
        if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.role?.toUpperCase())) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id: tenantId } = await paramsPromise;

        // Cascade delete is handled by Prisma/DB if configured, 
        // but let's do a safe transaction if needed or just delete the tenant.
        // In this project, most relations are defined with onDelete: Cascade in schema or handled manually.

        await (prisma as any).tenant.delete({
            where: { id: tenantId }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Tenant Delete Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
