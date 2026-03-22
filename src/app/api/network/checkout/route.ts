import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { prismaRaw as prisma } from "@/lib/prisma"
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
        const usePoints = body.usePoints === true;

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
                    select: { id: true, orderNumber: true }
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
                    categoryId: true,
                    dealerCompany: { select: { companyName: true, taxNumber: true } },
                    dealerUser: { select: { email: true, phone: true } },
                },
            })
            if (!membership || membership.status !== "ACTIVE") throw new HttpErr(403, "INVALID_MEMBERSHIP")

            let availablePoints = 0;
            let crmCustomer = null;
            if (membership?.dealerUser?.email) {
                crmCustomer = await tx.customer.findFirst({
                    where: { email: membership.dealerUser.email, company: { tenantId: ctx.supplierTenantId }, deletedAt: null },
                    select: { id: true, points: true }
                });
            }
            if (!crmCustomer && membership?.dealerCompany?.taxNumber) {
                crmCustomer = await tx.customer.findFirst({
                    where: { taxNumber: membership.dealerCompany.taxNumber, company: { tenantId: ctx.supplierTenantId }, deletedAt: null },
                    select: { id: true, points: true }
                });
            }
            if (crmCustomer) {
                availablePoints = Number(crmCustomer.points || 0);
            }

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

            let priceListId = null;
            if (membership.categoryId) {
                const custCat = await tx.customerCategory.findUnique({ where: { id: membership.categoryId } });
                if (custCat) priceListId = custCat.priceListId;
            }

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
                    category: true,
                    brand: true,
                    imageUrl: true,
                    variants: { select: { stock: true } },
                    ...(priceListId ? { productPrices: { where: { priceListId: priceListId }, select: { price: true } } } : {}),
                }
            })

            const byId = new Map<string, any>(products.map((p) => [p.id, p]))

            const allCampaigns = await tx.campaign.findMany({ where: { tenantId: ctx.supplierTenantId, isActive: true, deletedAt: null }, orderBy: { priority: "desc" } });
            const campaigns = allCampaigns.filter((c: any) => !c.channels || c.channels.length === 0 || c.channels.includes("B2B") || c.channels.includes("GLOBAL"));


            // Fetch explicit dealer catalog prices
            const catItems = await tx.dealerCatalogItem.findMany({
                where: { supplierTenantId: ctx.supplierTenantId, productId: { in: productIds } },
                select: { productId: true, price: true }
            });
            const catPriceMap = new Map();
            for (const c of catItems) {
                if (c.price !== null) catPriceMap.set(c.productId, toNumber(c.price));
            }

            // 3) Snapshot items + stok doğrulama
            let grandTotal = 0
            let earnablePoints = 0
            const snapshotItems: any[] = []

            for (const ci of cart.items) {
                const p = byId.get(ci.productId)
                if (!p) throw new HttpErr(404, "PRODUCT_NOT_FOUND_IN_SCOPE", { productId: ci.productId })

                const variantStock = Array.isArray(p.variants) ? p.variants.reduce((acc: number, v: any) => acc + (v.stock || 0), 0) : 0;
                const totalStock = toNumber(p.stock) + variantStock;
                const reservedStock = toNumber(p.reservedStock)
                const available = totalStock - reservedStock
                if (ci.quantity > available) {
                    throw new HttpErr(409, "INSUFFICIENT_STOCK", { productId: p.id, available, requested: ci.quantity })
                }

                let listPriceMapped = null;
                if (p.productPrices && p.productPrices.length > 0) {
                    listPriceMapped = toNumber(p.productPrices[0].price);
                }

                const catPriceRaw = catPriceMap.get(p.id);
                const catPrice = catPriceRaw !== undefined ? catPriceRaw : null;
                
                const priceResolved = listPriceMapped !== null 
                    ? listPriceMapped 
                    : (catPrice !== null ? catPrice : toNumber(p.price));

                const listPrice = priceResolved;

                // First apply base exact price if category is matched
                // Then apply percentage discount logic
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
                    data: { reservedStock: { increment: ci.quantity } }
                })
            }

            // --- CREDIT EXPOSURE CHECK ---
            const settings = await tx.dealerNetworkSettings.findUnique({
                where: { tenantId: ctx.supplierTenantId },
                select: { creditPolicy: true, approvalRequiresPaymentIfFlagged: true, shippingCost: true, freeShippingThreshold: true }
            })
            const creditPolicy = settings?.creditPolicy || "HARD_LIMIT"

            const shippingCost = settings?.shippingCost ? Number(settings.shippingCost) : 0
            const freeShippingThreshold = settings?.freeShippingThreshold ? Number(settings.freeShippingThreshold) : 0
            
            let shippingFee = 0;
            if (shippingCost > 0 && grandTotal > 0 && (freeShippingThreshold === 0 || grandTotal < freeShippingThreshold)) {
                shippingFee = shippingCost;
            }

            if (shippingFee > 0) {
                grandTotal += shippingFee;
                snapshotItems.push({
                    id: "shipping-" + Date.now(),
                    productId: "shipping_fee",
                    name: "Kargo Ücreti",
                    code: "KARGO-01",
                    barcode: "KARGO-01",
                    quantity: 1,
                    unit: "ADET",
                    unitPrice: shippingFee,
                    listPrice: shippingFee,
                    discountPct: 0,
                    lineTotal: shippingFee,
                })
            }

            const { creditLimit, exposureBase } = await computeExposureBase(ctx)
            
            let pointsUsedAmount = 0;
            if (usePoints && availablePoints > 0) {
                pointsUsedAmount = Math.min(grandTotal, availablePoints);
                if (pointsUsedAmount > 0) {
                    grandTotal -= pointsUsedAmount;
                    snapshotItems.push({
                        id: "pts-" + Date.now(),
                        productId: "parapuan_usage",
                        name: "Parapuan Kullanımı",
                        code: "P-IND-01",
                        barcode: "P-IND",
                        quantity: 1,
                        unit: "ADET",
                        unitPrice: -pointsUsedAmount,
                        listPrice: -pointsUsedAmount,
                        discountPct: 0,
                        lineTotal: -pointsUsedAmount,
                    })
                }
            }
            
            const projectedExposure = exposureBase + grandTotal
            
            // Fix: 0 limit means 0 credit, not unlimited!
            const limitExceeded = projectedExposure > creditLimit

            let isLimitExceeded = false
            let creditExceededAmount: number | undefined = undefined
            let paymentRequired = false

            if (limitExceeded) {
                if (paymentMode === "ON_ACCOUNT" && (creditPolicy === "HARD_LIMIT" || creditPolicy === "FORCE_CARD_ON_LIMIT")) {
                    await auditLog({
                        tenantId: ctx.supplierTenantId,
                        actorDealerUserId: ctx.dealerUserId,
                        type: creditPolicy === "FORCE_CARD_ON_LIMIT" ? "CREDIT_LIMIT_FORCE_PAYMENT" : "CREDIT_LIMIT_EXCEEDED",
                        entityType: "DealerMembership",
                        entityId: ctx.activeMembershipId,
                        meta: { creditLimit, exposureBase, projectedExposure, paymentMode, policy: creditPolicy }
                    }).catch(e => console.error(e))

                    throw new HttpErr(409, "INSUFFICIENT_CREDIT_LIMIT", {
                        creditLimit, exposureBase, projectedExposure, requiredPayment: creditPolicy === "FORCE_CARD_ON_LIMIT" ? "CARD" : "NONE", policy: creditPolicy
                    })
                }

                // Either CARD or SOFT_LIMIT + ON_ACCOUNT => order drops but gets flagged
                isLimitExceeded = true
                creditExceededAmount = projectedExposure - creditLimit
                // paymentRequired depends on other factors, do not set forcefully by approvalRequiresPaymentIfFlagged

                await auditLog({
                    tenantId: ctx.supplierTenantId,
                    actorDealerUserId: ctx.dealerUserId,
                    type: "CREDIT_LIMIT_EXCEEDED",
                    entityType: "Order",
                    entityId: idempotencyKey, // placeholder until order creation
                    meta: { creditLimit, exposureBase, projectedExposure, grandTotal, policy: creditPolicy }
                }).catch(e => console.error(e))
            }
            // -----------------------------

            // 5) Order create (core model fields)
            const orderNumber = makeOrderNumber()
            const customerName = membership.dealerCompany?.companyName || membership.dealerUser?.email || "B2B Bayi"
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
                select: { id: true, orderNumber: true }
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
        return NextResponse.json({ ok: false, error: "CHECKOUT_FAILED", details: e?.message, stack: e?.stack }, { status: 500 })
    }
}
