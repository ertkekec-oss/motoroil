import { NextResponse } from "next/server"
import { prismaRaw as prisma } from "@/lib/prisma"
import { requireDealerContext } from "@/lib/network/context"

export async function GET() {
    try {
        const ctx = await requireDealerContext()

        // Get Membership
        const membership = await prisma.dealerMembership.findUnique({
            where: { id: ctx.activeMembershipId },
            include: { dealerUser: true, dealerCompany: true }
        })

        if (!membership || membership.status !== "ACTIVE") {
            return NextResponse.json({ ok: false, error: "INVALID_MEMBERSHIP_CONTEXT" }, { status: 403 })
        }

        // Try to find the associated Customer in the CRM to fetch Formal Invoices and Transactions
        let customerId = null;
        let crmCustomer = null;

        if (membership.dealerUser?.email) {
            crmCustomer = await prisma.customer.findFirst({
                where: { email: membership.dealerUser.email, company: { tenantId: membership.tenantId }, deletedAt: null },
                select: { id: true, companyId: true }
            })
        }
        if (!crmCustomer && membership.dealerCompany?.taxNumber) {
            crmCustomer = await prisma.customer.findFirst({
                where: { taxNumber: membership.dealerCompany.taxNumber, company: { tenantId: membership.tenantId }, deletedAt: null },
                select: { id: true, companyId: true }
            })
        }

        if (crmCustomer) customerId = crmCustomer.id;

        // 1) Fetch Marketplaces Orders (B2B Orders)
        const b2bOrders = await prisma.order.findMany({
            where: {
                dealerMembershipId: ctx.activeMembershipId,
                deletedAt: null
            },
            orderBy: { orderDate: 'desc' },
            take: 50,
            select: {
                id: true,
                orderNumber: true,
                status: true,
                orderDate: true,
                totalAmount: true,
                items: true,
            }
        });

        // 2) Fetch Formal Invoices strictly mapped to this user's orders OR their CRM Customer Profile
        let invoices: any[] = [];
        let transactions: any[] = [];

        if (customerId) {
            invoices = await prisma.salesInvoice.findMany({
                where: { customerId, deletedAt: null },
                orderBy: { invoiceDate: 'desc' },
                take: 50,
                select: {
                    id: true,
                    invoiceNo: true,
                    invoiceDate: true,
                    totalAmount: true,
                    status: true,
                    isFormal: true,
                    orderId: true,
                    items: true
                }
            });

            transactions = await prisma.transaction.findMany({
                where: { customerId, deletedAt: null },
                orderBy: { date: 'desc' },
                take: 50,
                select: {
                    id: true,
                    date: true,
                    type: true,
                    description: true,
                    amount: true
                }
            });
        } else {
            // Fallback: If no CRM customer linked, at least try to fetch invoices linked to the B2B Orders directly
            const orderIds = b2bOrders.map(o => o.id);
            if (orderIds.length > 0) {
                invoices = await prisma.salesInvoice.findMany({
                    where: { orderId: { in: orderIds }, deletedAt: null },
                    orderBy: { invoiceDate: 'desc' },
                    take: 50,
                    select: {
                        id: true, invoiceNo: true, invoiceDate: true, totalAmount: true, status: true, isFormal: true, orderId: true, items: true
                    }
                });

                // Cannot fetch transactions by orderId natively since it's not a field
                transactions = [];
            }
        }

        return NextResponse.json({
            ok: true,
            orders: b2bOrders.map(o => ({
                id: o.id,
                no: o.orderNumber,
                date: o.orderDate,
                amount: Number(o.totalAmount || 0),
                status: o.status,
                items: typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || [])
            })),
            invoices: invoices.map(i => ({
                id: i.id,
                no: i.invoiceNo,
                date: i.invoiceDate,
                amount: Number(i.totalAmount || 0),
                status: i.status,
                isFormal: i.isFormal,
                orderId: i.orderId,
                items: typeof i.items === 'string' ? JSON.parse(i.items) : (i.items || [])
            })),
            transactions: transactions.map(t => ({
                id: t.id,
                date: t.date,
                type: t.type,
                desc: t.description,
                amount: Number(t.amount || 0)
            }))
        });

    } catch (e: any) {
        console.error("FINANCES_ERR:", e);
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
