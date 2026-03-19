import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = session.user || session;
        const tenantId = session.tenantId || user.tenantId;

        if (!user.permissions?.includes('b2b_manage') && !['TENANT_OWNER', 'SUPER_ADMIN', 'ADMIN', 'PLATFORM_ADMIN'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (!tenantId) return NextResponse.json({ error: 'No tenant context' }, { status: 400 });

        const url = new URL(req.url);
        const q = url.searchParams.get("q") || "";
        const take = parseInt(url.searchParams.get("take") || "50", 10);

        // Include all valid products for this tenant
        const rawProducts = await prisma.product.findMany({
            where: {
                company: { tenantId },
                ...(q ? {
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { code: { contains: q, mode: 'insensitive' } }
                    ]
                } : {})
            },
            take,
            select: {
                id: true,
                name: true,
                code: true,
                price: true,
                stock: true,
                dealerCatalogItems: {
                    where: { supplierTenantId: tenantId }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Map to UI friendly shape
        const items = rawProducts.map((p: any) => {
            const catalogItem = p.dealerCatalogItems?.[0];
            return {
                id: p.id,
                name: p.name,
                sku: p.code,
                basePrice: p.price,
                stock: p.stock,
                isVisible: catalogItem?.visibility === 'VISIBLE',
                dealersPrice: catalogItem?.price ?? null,
                minOrderQty: catalogItem?.minOrderQty ?? 1,
                maxOrderQty: catalogItem?.maxOrderQty ?? null
            };
        });

        return NextResponse.json({ ok: true, items });
    } catch (error: any) {
        console.error('Dealer Catalog GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = session.user || session;
        const tenantId = session.tenantId || user.tenantId;

        if (!user.permissions?.includes('b2b_manage') && !['TENANT_OWNER', 'SUPER_ADMIN', 'ADMIN', 'PLATFORM_ADMIN'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (!tenantId) return NextResponse.json({ error: 'No tenant context' }, { status: 400 });

        const body = await req.json();
        const { items } = body; // items: [{ productId, isVisible, dealersPrice, minOrderQty, maxOrderQty }]

        if (!Array.isArray(items)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const upserts = items.map((item: any) => {
            return prisma.dealerCatalogItem.upsert({
                where: {
                    supplierTenantId_productId: {
                        supplierTenantId: tenantId,
                        productId: item.productId
                    }
                },
                update: {
                    visibility: item.isVisible ? 'VISIBLE' : 'HIDDEN',
                    price: item.dealersPrice !== undefined ? item.dealersPrice : undefined,
                    minOrderQty: item.minOrderQty !== undefined ? item.minOrderQty : undefined,
                    maxOrderQty: item.maxOrderQty !== undefined ? item.maxOrderQty : undefined,
                },
                create: {
                    supplierTenantId: tenantId,
                    productId: item.productId,
                    visibility: item.isVisible ? 'VISIBLE' : 'HIDDEN',
                    price: item.dealersPrice ?? null,
                    minOrderQty: item.minOrderQty ?? 1,
                    maxOrderQty: item.maxOrderQty ?? null,
                }
            });
        });

        await prisma.$transaction(upserts);

        try {
            await prisma.commerceAuditLog.create({
                data: {
                    sellerCompanyId: tenantId, // we need sellerCompanyId, using tenantId for now if Company doesn't matter or we can find the default company
                    actorType: 'USER',
                    action: 'DEALER_CATALOG_UPDATED' as any,
                    entityType: 'DealerCatalog',
                    entityId: tenantId,
                    payloadJson: { count: items.length }
                }
            }).catch(() => { });
        } catch (e) { /* fail-open */ }

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('Dealer Catalog PATCH Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
