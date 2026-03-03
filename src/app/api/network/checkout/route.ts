import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import prisma from "@/lib/prisma"
import { requireDealerContext } from "@/lib/network/context"
import { enqueueAccountingEvent } from "@/lib/network/accounting/outbox"
import { computeExposureBase } from "@/lib/network/credit/exposure"
import { auditLog } from "@/lib/audit/log"

function toNumber(v: any) {
    return typeof v === "object" ? Number(v) : Number(v ?? 0)
}

function makeOrderNumber() {
    const yy = new Date().getFullYear().toString().slice(2)
    return `B2B-${yy}-${randomBytes(3).toString("hex").toUpperCase()}`
}

class HttpErr extends Error {
    constructor(public http: number, public code: string, public meta?: any) {
        super(code)
    }
}

export async function POST(req: Request) {
    try {
        const ctx = await requireDealerContext()
        const body = await req.json().catch(() => ({}))

        // idempotency key: client üretmeli (crypto.randomUUID)
        const idempotencyKey = String(body.idempotencyKey || "")
        if (!idempotencyKey || idempotencyKey.length < 8) {
            return NextResponse.json({ ok: false, error: "IDEMPOTENCY_REQUIRED" }, { status: 400 })
        }

        const paymentMode = body.paymentMode === "ON_ACCOUNT" ? "ON_ACCOUNT" : "CARD"

        const result = await prisma.$transaction(async (tx) => {
            // 0) Idempotency (membership scoped)
            const attempt = await tx.dealerCheckoutAttempt.upsert({
                where: {
                    membershipId_idempotencyKey: {
                        membershipId: ctx.activeMembershipId,
                        idempotencyKey,
                    },
                },
                update: {},
                create: { membershipId: ctx.activeMembershipId, idempotencyKey },
                select: { id: true, orderId: true },
            })

            if (attempt.orderId) {
                const existing = await tx.order.findUnique({
                    where: { id: attempt.orderId },
                    select: { id: true, orderNumber: true },
                })
                return { orderId: existing?.id ?? attempt.orderId, orderNumber: existing?.orderNumber ?? null, reused: true }
            }

            // 1) Cart + membership + rule hepsi TX içinde
            const cart = await tx.dealerCart.findFirst({
                where: {
                    membershipId: ctx.activeMembershipId,
                    status: "ACTIVE",
                },
                select: {
                    id: true,
                    membershipId: true,
                    supplierTenantId: true,
                    items: { select: { id: true, productId: true, quantity: true } },
                },
            })
            if (!cart || cart.items.length === 0) throw new HttpErr(400, "EMPTY_CART")

            // Context mismatch guard (ek kilit)
            if (cart.supplierTenantId !== ctx.supplierTenantId) {
                throw new HttpErr(403, "TENANT_CONTEXT_MISMATCH")
            }

            const membership = await tx.dealerMembership.findUnique({
                where: { id: ctx.activeMembershipId },
                select: {
                    id: true,
                    status: true,
                    financialMode: true,
                    dealerCompany: { select: { companyName: true } },
                    dealerUser: { select: { name: true, email: true } },
                },
            })
            if (!membership || membership.status !== "ACTIVE") throw new HttpErr(403, "INVALID_MEMBERSHIP")

            const rule = await tx.dealerPriceRule.findFirst({
                where: {
                    memberships: { some: { id: ctx.activeMembershipId } },
                    tenantId: ctx.supplierTenantId,
                    isActive: true,
                },
                orderBy: { discount: "desc" },
                select: { discount: true },
            })
            const discountPct = rule?.discount ? toNumber(rule.discount) : 0

            // 2) Products scope
            const productIds = cart.items.map((i) => i.productId)
            const products = await tx.product.findMany({
                where: {
                    id: { in: productIds },
                    company: { tenantId: ctx.supplierTenantId }, // supplierTenantId company map aracari
                    deletedAt: null,
                },
                select: {
                    id: true,
                    name: true,
                    code: true,
                    barcode: true,
                    unit: true,
                    price: true, // Decimal(10,2)
                    stock: true, // Int
                    reservedStock: true, // YENI
                },
            })

            const byId = new Map<string, any>(products.map((p) => [p.id, p]))

            // 3) Snapshot items + stok doğrulama
            let grandTotal = 0
            const snapshotItems: any[] = []

            for (const ci of cart.items) {
                const p = byId.get(ci.productId)
                if (!p) throw new HttpErr(404, "PRODUCT_NOT_FOUND_IN_SCOPE", { productId: ci.productId })

                const stock = toNumber(p.stock)
                const reservedStock = toNumber(p.reservedStock)
                const available = stock - reservedStock
                if (ci.quantity > available) {
                    throw new HttpErr(409, "INSUFFICIENT_STOCK", { productId: p.id, available, requested: ci.quantity })
                }

                const listPrice = toNumber(p.price)
                const effectivePrice = discountPct > 0 ? Math.max(0, listPrice * (1 - discountPct / 100)) : listPrice
                const lineTotal = effectivePrice * ci.quantity
                grandTotal += lineTotal

                snapshotItems.push({
                    id: ci.id,
                    productId: p.id,
                    name: p.name,
                    code: p.code,
                    barcode: p.barcode,
                    quantity: ci.quantity,
                    unit: p.unit,
                    unitPrice: effectivePrice, // snapshot
                    listPrice,
                    discountPct,
                    lineTotal,
                })
            }

            // 4) Reserve stock
            for (const ci of cart.items) {
                await tx.product.update({
                    where: { id: ci.productId },
                    data: { reservedStock: { increment: ci.quantity } },
                })
            }

            // --- CREDIT EXPOSURE CHECK ---
            const { creditLimit, exposureBase } = await computeExposureBase(ctx)
            const projectedExposure = exposureBase + grandTotal
            const limitExceeded = creditLimit > 0 && projectedExposure > creditLimit

            if (limitExceeded && paymentMode === "ON_ACCOUNT") {
                await auditLog({
                    tenantId: ctx.supplierTenantId,
                    actorDealerUserId: ctx.dealerUserId,
                    type: "CREDIT_LIMIT_FORCE_PAYMENT",
                    entityType: "DealerMembership",
                    entityId: ctx.activeMembershipId,
                    meta: { creditLimit, exposureBase, projectedExposure, paymentMode }
                }).catch(e => console.error(e))

                throw new HttpErr(409, "INSUFFICIENT_CREDIT_LIMIT", {
                    creditLimit, exposureBase, projectedExposure, requiredPayment: "CARD"
                })
            }

            let isLimitExceeded = false
            let creditExceededAmount: number | undefined = undefined
            let paymentRequired = false

            if (limitExceeded) {
                isLimitExceeded = true
                creditExceededAmount = projectedExposure - creditLimit
                paymentRequired = true

                await auditLog({
                    tenantId: ctx.supplierTenantId,
                    actorDealerUserId: ctx.dealerUserId,
                    type: "CREDIT_LIMIT_EXCEEDED",
                    entityType: "Order",
                    entityId: idempotencyKey, // placeholder until order creation
                    meta: { creditLimit, exposureBase, projectedExposure, grandTotal }
                }).catch(e => console.error(e))
            }
            // -----------------------------

            // 5) Order create (core model fields)
            const orderNumber = makeOrderNumber()
            const customerName = membership.dealerCompany?.companyName || membership.dealerUser?.name || "B2B Bayi"
            const customerEmail = membership.dealerUser?.email || ""

            // Satici tenant altindaki uygun companyId'yi bul. Bir tenant in altindaki satici firmayi al.
            const supplierCompany = await tx.company.findFirst({
                where: { tenantId: ctx.supplierTenantId },
                select: { id: true },
                orderBy: { createdAt: "asc" }
            })

            if (!supplierCompany) throw new HttpErr(400, "SUPPLIER_COMPANY_NOT_FOUND")

            const order = await tx.order.create({
                data: {
                    orderNumber,
                    marketplace: "B2B_NETWORK",
                    marketplaceId: cart.id,
                    customerName,
                    customerEmail,
                    totalAmount: grandTotal,
                    currency: "TRY",
                    status: "PENDING_APPROVAL",
                    orderDate: new Date(),
                    items: snapshotItems, // JSON snapshot
                    companyId: supplierCompany.id,
                    salesChannel: "DEALER_B2B",
                    dealerPrice: grandTotal,
                    dealerMembershipId: ctx.activeMembershipId,
                    isLimitExceeded,
                    creditExceededAmount,
                    paymentRequired,
                },
                select: { id: true, orderNumber: true },
            })

            // 6) cart close
            await tx.dealerCart.update({
                where: { id: cart.id },
                data: { status: "CHECKED_OUT" },
            })

            // 7) finalize attempt
            await tx.dealerCheckoutAttempt.update({
                where: { id: attempt.id },
                data: { orderId: order.id },
            })

            return { orderId: order.id, orderNumber: order.orderNumber, reused: false, financialMode: membership.financialMode }
        })

        if (result.financialMode === "ERP_POSTING") {
            enqueueAccountingEvent({
                tenantId: ctx.supplierTenantId,
                event: "ORDER_CREATED",
                entityId: result.orderId,
            }).catch(e => console.error("Accounting enqueue failed", e));
        }

        return NextResponse.json({ ok: true, orderId: result.orderId, orderNumber: result.orderNumber, reused: result.reused })
    } catch (e: any) {
        if (e.message === "UNAUTHORIZED" || e.message === "NO_ACTIVE_MEMBERSHIP" || e.message === "INVALID_MEMBERSHIP_CONTEXT") {
            return NextResponse.json({ ok: false, error: e.message }, { status: 403 })
        }
        if (e instanceof HttpErr) {
            return NextResponse.json({ ok: false, error: e.code, meta: e.meta ?? null }, { status: e.http })
        }
        return NextResponse.json({ ok: false, error: "CHECKOUT_FAILED" }, { status: 500 })
    }
}
