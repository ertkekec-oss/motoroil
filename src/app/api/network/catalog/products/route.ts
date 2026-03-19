import { NextResponse } from "next/server"
import { prismaRaw as prisma } from "@/lib/prisma"
import { requireDealerContext } from "@/lib/network/context"

const TAKE = 30

function toNumber(v: any) {
    return typeof v === "object" ? Number(v) : Number(v ?? 0)
}

export async function GET(req: Request) {
    try {
        const ctx = await requireDealerContext()

        const url = new URL(req.url)
        const q = (url.searchParams.get("q") || "").trim()
        const cursor = url.searchParams.get("cursor")

        // 1) Membership bazlı aktif price rule çek (V1: global rule ya da membership'e bağlanmış kural)
        const membership = await prisma.dealerMembership.findUnique({
            where: { id: ctx.activeMembershipId },
            select: { priceRule: { select: { discount: true, isActive: true } } },
        });

        const rule = membership?.priceRule?.isActive ? membership.priceRule : null;
        const discountPct = rule ? toNumber(rule.discount) : 0; // % olarak (örn: 15.00)

        // 2) Product scope (mutlak tenant filtresi - company üzerinden tenant kontrolü)
        const where: any = {
            company: { tenantId: ctx.supplierTenantId }, // companyId üzerinden supplier'ın tenant kontrolü
            deletedAt: null,
        }

        if (q) {
            where.OR = [
                { name: { contains: q, mode: "insensitive" } },
                { code: { contains: q, mode: "insensitive" } },
                { barcode: { contains: q, mode: "insensitive" } },
                { brand: { contains: q, mode: "insensitive" } },
            ]
        }

        const products = await prisma.product.findMany({
            where,
            take: TAKE + 1,
            ...(cursor
                ? {
                    cursor: { id: cursor },
                    skip: 1,
                }
                : {}),
            orderBy: { updatedAt: "desc" },
            select: {
                id: true,
                name: true,
                code: true, // SKU yerine code
                brand: true,
                unit: true,
                price: true, // salePrice yerine price
                stock: true, // stockQty yerine stock
                reservedStock: true, // reserve validation icin
                barcode: true,
            },
        })

        const hasMore = products.length > TAKE
        const page = hasMore ? products.slice(0, TAKE) : products
        const nextCursor = hasMore ? page[page.length - 1]?.id ?? null : null

        const items = page.map((p) => {
            const listPrice = toNumber(p.price)
            const effectivePrice =
                discountPct > 0 ? Math.max(0, listPrice * (1 - discountPct / 100)) : listPrice

            return {
                id: p.id,
                name: p.name,
                sku: p.code,
                brand: p.brand,
                unit: p.unit,
                listPrice,
                effectivePrice,
                discountPct,
                stockQty: Math.max(0, toNumber(p.stock) - toNumber(p.reservedStock)),
            }
        })

        return NextResponse.json({ ok: true, items, nextCursor })
    } catch (error: any) {
        if (error.message === "UNAUTHORIZED" || error.message === "NO_ACTIVE_MEMBERSHIP" || error.message === "INVALID_MEMBERSHIP_CONTEXT") {
            return NextResponse.json({ ok: false, error: error.message }, { status: 403 })
        }
        return NextResponse.json({ ok: false, error: "CATALOG_ERROR" }, { status: 500 })
    }
}
