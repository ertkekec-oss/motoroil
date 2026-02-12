import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const data = {
    "products": [
        {
            "decision": "NEW_PRODUCT",
            "confidence": 0.99,
            "product_create_draft": {
                "name": "Kraftvoll Bagaj Amortisörü Tipo 94-00",
                "brand": "Kraftvoll",
                "barcode": null,
                "unit_type": "ADET",
                "variants": []
            }
        },
        {
            "decision": "NEW_PRODUCT",
            "confidence": 0.99,
            "product_create_draft": {
                "name": "Motul Fork Oil Expert Light 5W 1 L",
                "brand": "Motul",
                "barcode": null,
                "unit_type": "LT",
                "variants": []
            }
        },
        {
            "decision": "NEW_PRODUCT",
            "confidence": 0.99,
            "product_create_draft": {
                "name": "Liqui Moly Radyatör Antifrizi KFS 13 1 L Kırmızı",
                "brand": "Liqui Moly",
                "barcode": null,
                "unit_type": "LT",
                "variants": [
                    { "variant_name": "1 L Kırmızı", "color": "Kırmızı", "size": "1 L", "barcode": null }
                ]
            }
        },
        {
            "decision": "NEW_PRODUCT",
            "confidence": 0.99,
            "product_create_draft": {
                "name": "DFI Cleaner",
                "brand": null,
                "barcode": null,
                "unit_type": "ADET",
                "variants": []
            }
        },
        {
            "decision": "NEW_PRODUCT",
            "confidence": 0.99,
            "product_create_draft": {
                "name": "Motul E1 Wash & Wax 400 ml",
                "brand": "Motul",
                "barcode": null,
                "unit_type": "PAKET",
                "variants": []
            }
        },
        {
            "decision": "NEW_PRODUCT",
            "confidence": 0.99,
            "product_create_draft": {
                "name": "Motul 300V Racing 4T 5W-40 1 L",
                "brand": "Motul",
                "barcode": null,
                "unit_type": "LT",
                "variants": []
            }
        },
        {
            "decision": "NEW_PRODUCT",
            "confidence": 0.99,
            "product_create_draft": {
                "name": "Shad SH-34 34 L Arka Çanta",
                "brand": "Shad",
                "barcode": null,
                "unit_type": "ADET",
                "variants": []
            }
        },
        {
            "decision": "NEW_PRODUCT",
            "confidence": 0.99,
            "product_create_draft": {
                "name": "Salcano Helen 26 Jant Bisiklet",
                "brand": "Salcano",
                "barcode": null,
                "unit_type": "ADET",
                "variants": [
                    { "variant_name": "Pembe", "color": "Pembe", "size": "26 Jant", "barcode": null },
                    { "variant_name": "Siyah", "color": "Siyah", "size": "26 Jant", "barcode": null },
                    { "variant_name": "Beyaz", "color": "Beyaz", "size": "26 Jant", "barcode": null }
                ]
            }
        },
        {
            "decision": "NEW_PRODUCT",
            "confidence": 0.99,
            "product_create_draft": {
                "name": "EGR Valf ve Enjektör Temizleyici 300 ml",
                "brand": null,
                "barcode": null,
                "unit_type": "PAKET",
                "variants": []
            }
        },
        {
            "decision": "NEW_PRODUCT",
            "confidence": 0.99,
            "product_create_draft": {
                "name": "Anatol 3'lü Zigon Sehpa Seti Gümüş Ayak Siyah Cam",
                "brand": "Anatol",
                "barcode": null,
                "unit_type": "SET",
                "variants": [
                    { "variant_name": "Gümüş Ayak / Siyah Cam", "color": "Siyah", "size": "3'lü", "barcode": null }
                ]
            }
        }
    ]
};

async function main() {
    const company = await prisma.company.findFirst();
    if (!company) throw new Error("No company found");

    const orders = await prisma.order.findMany();

    for (const item of data.products) {
        const draft = item.product_create_draft;

        // 1. Create Product
        const product = await prisma.product.create({
            data: {
                companyId: company.id,
                name: draft.name,
                brand: draft.brand,
                barcode: draft.barcode,
                unit: draft.unit_type,
                code: `ERP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                price: 0,
                category: "Genel"
            }
        });

        console.log(`Created product: ${product.name} (${product.id})`);

        // 2. Map to Marketplace
        for (const order of orders) {
            const orderItems = Array.isArray(order.items) ? order.items : [];
            for (const orderItem of orderItems) {
                const draftWords = draft.name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
                const orderWords = orderItem.productName.toLowerCase().split(/\s+/);
                // Special handle for numbers like 300, 300v
                const matchCount = draftWords.filter(w => orderWords.some(ow => ow.includes(w) || w.includes(ow))).length;
                const matchRatio = matchCount / draftWords.length;

                if (matchRatio >= 0.4) {
                    await prisma.marketplaceProductMap.upsert({
                        where: { marketplace_marketplaceCode: { marketplace: order.marketplace, marketplaceCode: orderItem.sku } },
                        update: { productId: product.id },
                        create: {
                            marketplace: order.marketplace,
                            marketplaceCode: orderItem.sku,
                            productId: product.id
                        }
                    });
                    console.log(`  Mapped ${order.marketplace} SKU ${orderItem.sku} to ${product.id} (${Math.round(matchRatio * 100)}% match)`);
                }
            }
        }

        // 3. Handle Variants
        if (draft.variants && draft.variants.length > 0) {
            for (const v of draft.variants) {
                await prisma.product.create({
                    data: {
                        companyId: company.id,
                        name: `${draft.name} - ${v.variant_name}`,
                        parentId: product.id,
                        brand: draft.brand,
                        barcode: v.barcode,
                        unit: draft.unit_type,
                        code: `ERP-V-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                        price: 0
                    }
                });
            }
        }
    }

    // 4. Update PnL
    const events = await prisma.domainEvent.findMany({
        where: { eventType: 'SALE_COMPLETED' }
    });

    for (const event of events) {
        const payload = event.payload;
        const map = await prisma.marketplaceProductMap.findFirst({
            where: { marketplace: payload.marketplace, marketplaceCode: payload.sku }
        });

        if (map) {
            const saleAmount = payload.saleAmount || 0;
            await prisma.marketplaceProductPnl.upsert({
                where: {
                    companyId_productId_marketplace: {
                        companyId: company.id,
                        productId: map.productId,
                        marketplace: payload.marketplace
                    }
                },
                create: {
                    companyId: company.id,
                    productId: map.productId,
                    marketplace: payload.marketplace,
                    grossRevenue: saleAmount,
                    saleCount: 1,
                    netProfit: saleAmount,
                    profitMargin: 100
                },
                update: {
                    grossRevenue: { increment: saleAmount },
                    saleCount: { increment: 1 },
                    netProfit: { increment: saleAmount }
                }
            });
            console.log(`  PnL Updated for ${map.productId}`);
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
