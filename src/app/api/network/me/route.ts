import { NextResponse } from "next/server"
import { prismaRaw as prisma } from "@/lib/prisma"
import { requireDealerContext } from "@/lib/network/context"

export async function GET() {
    try {
        const ctx = await requireDealerContext()

        const membership = await prisma.dealerMembership.findUnique({
            where: { id: ctx.activeMembershipId },
            select: {
                id: true,
                status: true,
                tenantId: true,
                creditLimit: true,
                tenant: { select: { id: true, name: true, ownerEmail: true, phone: true, companies: { take: 1, select: { vkn: true, address: true, city: true, district: true, taxOffice: true } } } },
                dealerUser: { select: { email: true } },
                dealerCompany: { select: { id: true, companyName: true, taxNumber: true } },
            },
        })

        if (!membership || membership.status !== "ACTIVE") {
            return NextResponse.json({ ok: false, error: "INVALID_MEMBERSHIP_CONTEXT" }, { status: 403 })
        }

        const creditLimit =
            typeof membership.creditLimit === "object"
                ? Number(membership.creditLimit)
                : membership.creditLimit

        let balance = 0;
        let customerId = null;
        
        // 1) Match by Email
        let crmCustomer = null;
        if (membership.dealerUser?.email) {
            crmCustomer = await prisma.customer.findFirst({
                where: { 
                    email: membership.dealerUser.email, 
                    company: { tenantId: membership.tenantId },
                    deletedAt: null 
                },
                select: { id: true, balance: true }
            })
        }
        
        // 2) Match by Tax Number (Fallback)
        if (!crmCustomer && membership.dealerCompany?.taxNumber) {
            crmCustomer = await prisma.customer.findFirst({
                where: { 
                    taxNumber: membership.dealerCompany.taxNumber, 
                    company: { tenantId: membership.tenantId },
                    deletedAt: null 
                },
                select: { id: true, balance: true }
            })
        }
        
        if (crmCustomer) {
            balance = typeof crmCustomer.balance === "object" ? Number(crmCustomer.balance) : Number(crmCustomer.balance || 0);
            customerId = crmCustomer.id;
        }

        // Get un-invoiced / pending order exposure for exact credit usage
        const { computeExposureBase } = await import("@/lib/network/credit/exposure");
        const { exposureBase } = await computeExposureBase(ctx).catch(() => ({ exposureBase: 0 }));

        return NextResponse.json({
            ok: true,
            me: {
                dealerUserId: ctx.dealerUserId,
                dealerCompanyId: ctx.dealerCompanyId,
                dealerCompanyName: membership.dealerCompany?.companyName ?? null,

                activeMembershipId: membership.id,
                supplierTenantId: membership.tenantId,
                supplierName: membership.tenant?.name ?? "Tedarikçi",

                customerId,
                creditLimit,
                balance,
                exposureBase,
                currency: "TRY",
                supplierEmail: membership.tenant?.ownerEmail ?? null,
                supplierPhone: membership.tenant?.phone ?? null,
                supplierAddress: membership.tenant?.companies?.[0]?.address ?? null,
                supplierCity: membership.tenant?.companies?.[0]?.city ?? null,
                supplierDistrict: membership.tenant?.companies?.[0]?.district ?? null,
                supplierVkn: membership.tenant?.companies?.[0]?.vkn ?? null,
                supplierTaxOffice: membership.tenant?.companies?.[0]?.taxOffice ?? null,
            },
        })
    } catch (error: any) {
        if (error.message === "UNAUTHORIZED" || error.message === "NO_ACTIVE_MEMBERSHIP" || error.message === "INVALID_MEMBERSHIP_CONTEXT") {
            return NextResponse.json({ ok: false, error: error.message }, { status: 403 })
        }
        return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 })
    }
}
