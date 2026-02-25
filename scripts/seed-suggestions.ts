
process.env.PRISMA_BYPASS_EXTENSION = "true";
const { prisma } = require("../src/lib/prisma");

async function seed() {
    const company = await prisma.company.findFirst();
    if (!company) throw new Error("Run seed first");
    const companyId = company.id;

    console.log("Seeding test data for Suggestion Engine...");

    await prisma.salesOrderItem.deleteMany({
        where: { product: { code: { in: ["OST-001", "LST-001", "MSF-001", "PRM-001"] } } }
    });

    await prisma.product.deleteMany({
        where: { code: { in: ["OST-001", "LST-001", "MSF-001", "PRM-001"] } }
    });

    // 1. Overstock Slow
    const p1 = await prisma.product.create({
        data: {
            companyId,
            name: "Overstock Product",
            code: "OST-001",
            stock: 500,
            price: 100,
        }
    });
    await prisma.stock.create({
        data: {
            productId: p1.id,
            branch: "Merkez",
            quantity: 500
        }
    });

    // 2. Low Stock
    const p2 = await prisma.product.create({
        data: {
            companyId,
            name: "Low Stock Product",
            code: "LST-001",
            stock: 2,
            price: 50,
        }
    });
    await prisma.stock.create({
        data: {
            productId: p2.id,
            branch: "Merkez",
            quantity: 2
        }
    });

    // Link p2 to a listing
    const gp2 = await prisma.globalProduct.create({ data: { name: p2.name, status: "APPROVED" } });
    await prisma.networkListing.create({
        data: {
            sellerCompanyId: companyId,
            erpProductId: p2.id,
            globalProductId: gp2.id,
            price: 50,
            availableQty: 2,
            minQty: 5,
            status: "ACTIVE"
        }
    });

    // 3. Missing Fields
    const p3 = await prisma.product.create({
        data: {
            companyId,
            name: "Missing Fields Product",
            code: "MSF-001",
            stock: 50,
            price: 200,
        }
    });
    await prisma.stock.create({
        data: {
            productId: p3.id,
            branch: "Merkez",
            quantity: 50
        }
    });
    const gp3 = await prisma.globalProduct.create({ data: { name: p3.name, status: "APPROVED" } });
    await prisma.networkListing.create({
        data: {
            sellerCompanyId: companyId,
            erpProductId: p3.id,
            globalProductId: gp3.id,
            price: 200,
            availableQty: 50,
            minQty: 0, // invalid
            leadTimeDays: 0, // invalid
            status: "ACTIVE"
        }
    });

    // 4. Price Missing
    const p4 = await prisma.product.create({
        data: {
            companyId,
            name: "Price Missing Product",
            code: "PRM-001",
            stock: 100,
            price: 0,
        }
    });
    await prisma.stock.create({
        data: {
            productId: p4.id,
            branch: "Merkez",
            quantity: 100
        }
    });
    const gp4 = await prisma.globalProduct.create({ data: { name: p4.name, status: "APPROVED" } });
    await prisma.networkListing.create({
        data: {
            sellerCompanyId: companyId,
            erpProductId: p4.id,
            globalProductId: gp4.id,
            price: 0,
            availableQty: 100,
            status: "ACTIVE"
        }
    });

    // Sales for p1 (only 1 sale)
    const rand = Math.floor(Math.random() * 1000000);
    const customer = await prisma.customer.create({
        data: {
            companyId,
            name: `Test Customer ${rand}`,
            taxNumber: `T${rand}`,
            branch: "Merkez"
        }
    });
    const staff = await prisma.staff.create({
        data: {
            name: `Test Staff ${rand}`,
            username: `user${rand}`,
            companyId: companyId,
            branch: "Merkez"
        }
    });

    const order = await prisma.salesOrder.create({
        data: {
            companyId,
            customerId: customer.id,
            staffId: staff.id,
            totalAmount: 100,
            status: "COMPLETED",
            items: {
                create: [
                    {
                        productId: p1.id,
                        productName: p1.name,
                        quantity: 1,
                        unitPrice: 100,
                        totalPrice: 100
                    }
                ]
            }
        }
    });

    console.log("Seed complete. CompanyId:", companyId);
}

seed().catch(console.error);
