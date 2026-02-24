import { prismaBase } from '../src/lib/prismaBase';
import prisma from '../src/lib/prisma';

async function test() {
    console.log("Starting P0 Audit: Decimal Rounding & JS Float Leak");

    const company = await prismaBase.company.findFirst();
    if (!company) { console.error("❌ No company found"); return; }
    console.log(`✅ Using Company: ${company.id}`);

    const customer = await prismaBase.customer.findFirst({ where: { companyId: company.id } });
    if (!customer) {
        console.log("Trying any customer...");
        const anyCustomer = await prismaBase.customer.findFirst();
        if (!anyCustomer) {
            console.error("❌ No customer found in entire DB");
            return;
        }
        console.log(`✅ Using Any Customer: ${anyCustomer.id} (Company: ${anyCustomer.companyId})`);
        // update company to match customer for the test
        (company as any).id = anyCustomer.companyId;
    } else {
        console.log(`✅ Using Customer: ${customer.id}`);
    }

    const cid = (customer || { id: '' }).id;
    const coid = (customer || { companyId: '' }).companyId!;

    // JS Leak Scenario: 0.1 + 0.2
    const val1 = 0.1;
    const val2 = 0.2;
    const jsTotal = val1 + val2;
    console.log(`JS Operation: 0.1 + 0.2 = ${jsTotal}`); // 0.30000000000000004

    // Create Invoice with 0.3 total
    const inv = await prismaBase.salesInvoice.create({
        data: {
            companyId: coid,
            customerId: cid,
            invoiceNo: 'AUDIT-RND-' + Math.random().toString(36).substring(7),
            amount: jsTotal,
            taxAmount: 0,
            totalAmount: jsTotal,
            items: [{ name: 'Test', price: jsTotal, qty: 1 }],
            status: 'Taslak',
            branch: 'Merkez'
        }
    });

    console.log(`Invoice ${inv.id} created.`);
    console.log(`DB Value (Decimal): ${inv.totalAmount.toString()}`);

    // Read back via Extended Prisma (with Number compute)
    const invRead = await (prisma as any).salesInvoice.findFirst({
        where: { id: inv.id },
        adminBypass: true
    });

    console.log(`Computed Read (Number): ${invRead.totalAmount}`);

    // Test Drift on Balance
    const startBal = Number((await prismaBase.customer.findUnique({ where: { id: cid } }))?.balance || 0);

    await prismaBase.customer.update({
        where: { id: cid },
        data: { balance: { increment: invRead.totalAmount } }
    });

    const endBal = Number((await prismaBase.customer.findUnique({ where: { id: cid } }))?.balance || 0);
    const diff = endBal - startBal;

    console.log(`Expected Increment: 0.3`);
    console.log(`Actual Increment:   ${diff}`);
    console.log(`Drift:              ${diff - 0.3}`);

    if (Math.abs(diff - 0.3) > 0.0000001) {
        console.error("🚨 DRIFT CONFIRMED! The Number() compute in prisma.ts is leaking float inaccuracies.");
    } else {
        console.log("✅ No drift in this case (DB or Prisma driver might have sanitized the number during round-trip).");
    }

    // Cleanup
    await prismaBase.salesInvoice.delete({ where: { id: inv.id } });
    await prismaBase.customer.update({ where: { id: cid }, data: { balance: startBal } });
}

test().catch(console.error);
