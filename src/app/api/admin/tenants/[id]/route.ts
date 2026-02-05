
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session: any = await getSession();
        if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.role?.toUpperCase())) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const tenantId = params.id;

        const tenant = await prisma.tenant.findUnique({
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
                    select: { id: true, username: true, role: true, email: true, createdAt: true }
                }
            }
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        // Detaylı Kullanım İstatistikleri
        // Son 6 ay invoice trendi vb. eklenebilir.
        // Hız için şimdilik temel snapshot.

        const invoiceCount = await prisma.salesInvoice.count({
            where: {
                companyId: { in: tenant.companies.map(c => c.id) },
                isFormal: true,
                createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
            }
        });

        const totalInvoices = await prisma.salesInvoice.count({
            where: {
                companyId: { in: tenant.companies.map(c => c.id) },
                isFormal: true
            }
        });

        // Subscription History
        const subHistory = await prisma.subscriptionHistory.findMany({
            where: { subscriptionId: tenant.subscription?.id },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        // External Requests (Son hatalar)
        const recentErrors = await prisma.externalRequest.findMany({
            where: {
                entityId: { in: (await prisma.salesInvoice.findMany({ where: { companyId: { in: tenant.companies.map(c => c.id) } }, select: { id: true }, take: 100 })).map(i => i.id) },
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
