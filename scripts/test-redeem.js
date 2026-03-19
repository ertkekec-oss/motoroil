const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const payload = {
        token: "cmmqv1wxx0001ips90uoifrhx",
        phoneE164: "05330213403",
        email: "ertkekec@gmail.com",
        company: {
            legalName: "EDİZ L.T.D",
            taxNo: "2369137850",
            city: "KAYSERİ",
            district: "TALAS"
        },
        password: "testpassword"
    };

    const phoneE164 = payload.phoneE164;
    const email = payload.email.toLowerCase();
    const legalName = payload.company.legalName;
    const taxNumber = payload.company.taxNo;
    const taxOffice = payload.company.taxOffice || null;
    const contactPerson = payload.company.contactPerson || null;
    const iban = payload.company.iban || null;
    const city = payload.company.city || null;
    const district = payload.company.district || null;
    const address = payload.company.address || null;
    
    try {
        const supplierCompany = await prisma.company.findFirst({
            where: { tenantId: "cmmqv1wxx0001ips90uoifrhx" },
            orderBy: { createdAt: "asc" },
            select: { id: true }
        });
        
        console.log("Supplier Company:", supplierCompany);

        if (supplierCompany) {
             const existingCustomer = await prisma.customer.findFirst({
                 where: { 
                     companyId: supplierCompany.id,
                     OR: [
                         { taxNumber: taxNumber },
                         { phone: phoneE164 }
                     ]
                 },
                 select: { id: true }
             });
             console.log("Existing Customer:", existingCustomer);
             if (!existingCustomer) {
                 console.log("Creating auto-cari...");
                 await prisma.customer.create({
                     data: {
                         companyId: supplierCompany.id,
                         name: legalName,
                         email,
                         phone: phoneE164,
                         taxNumber,
                         taxOffice,
                         contactPerson,
                         iban,
                         address,
                         city,
                         district,
                         branch: "Merkez",
                         supplierClass: "B2B_DEALER",
                         customerClass: "B2B_BAYI",
                         isPortalActive: true,
                         defaultCurrency: "TRY",
                         priceList: "B2B",
                     }
                 });
                 console.log("Cari created.");
             }
         }
         console.log("SUCCESS");
         
    } catch (e) {
         require('fs').writeFileSync('scripts/redeem-err.json', JSON.stringify({
             message: e.message,
             code: e.code,
             meta: e.meta
         }, null, 2));
         console.error("FAIL", e);
    }
}
main();
