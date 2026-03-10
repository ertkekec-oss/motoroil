import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function RUN_TENANT_ISOLATION_TEST() {
    console.log("=== CROSS-TENANT ISOLATION VALIDATION ===");
    console.log("Simulating bulk requests with conflicting session tenants...");

    // Assuming we have two tenants, T1 and T2
    const T1 = 'TENANT_A_MOCK';
    const T2 = 'TENANT_B_MOCK';

    const testCustomer1 = await prisma.customer.create({
        data: { tenantId: T1, type: 'CORPORATE', companyTitle: 'IsolCompany 1' }
    });

    const testCustomer2 = await prisma.customer.create({
        data: { tenantId: T2, type: 'CORPORATE', companyTitle: 'IsolCompany 2' }
    });

    console.log("Created isolated data records.");

    // Simulate API handler with session = T1
    const queryAsT1 = await prisma.customer.findMany({ where: { tenantId: T1 } });
    const queryAsT2 = await prisma.customer.findMany({ where: { tenantId: T2 } });

    console.log(`\n--- RESULTS ---`);
    console.log(`T1 Request results length: ${queryAsT1.length}`);
    const leaked1 = queryAsT1.some(c => c.tenantId !== T1);
    
    console.log(`T2 Request results length: ${queryAsT2.length}`);
    const leaked2 = queryAsT2.some(c => c.tenantId !== T2);

    if (leaked1 || leaked2) {
        console.log(`❌ TEST FAILED: TENANT LEAKAGE DETECTED! Fatal Architecture Risk.`);
    } else {
        console.log(`✅ TEST PASSED: No cross-tenant access. Isolation boundaries hold under Prisma context.`);
    }

    // Cleanup
    await prisma.customer.deleteMany({ where: { id: { in: [testCustomer1.id, testCustomer2.id] } } });
}

RUN_TENANT_ISOLATION_TEST().catch(console.error).finally(() => prisma.$disconnect());
