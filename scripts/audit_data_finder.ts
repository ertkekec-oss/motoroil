import { prismaBase } from '../src/lib/prismaBase';

async function findData() {
    const companies = await prismaBase.company.findMany({ take: 5 });
    console.log("Found Companies:", companies.length);
    for (const c of companies) {
        const cust = await prismaBase.customer.findFirst({ where: { companyId: c.id } });
        if (cust) {
            console.log(`MATCH: Company ${c.id} has Customer ${cust.id}`);
            return;
        }
    }
    console.log("No matching Company/Customer found.");
}

findData().catch(console.error);
