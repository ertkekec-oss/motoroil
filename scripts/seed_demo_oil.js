const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

function hashPassword(pass) {
    return crypto.createHash('sha256').update(pass).digest('hex');
}

async function main() {
    const email = process.argv[2] || 'oilshoptr@gmail.com';

    // 1. Find or create User and Tenant
    let user = await prisma.user.findUnique({ where: { email } });
    let tenantId;

    if (!user) {
        console.log("User not found, creating Demo User and Tenant...");
        const tenant = await prisma.tenant.create({
            data: {
                name: "Oil Shop Demo Tenant",
                plan: "ENTERPRISE",
                setupState: "COMPLETED"
            }
        });
        tenantId = tenant.id;

        // Let's encrypt standard password or just use what we have, wait this needs bcrypt for User model usually in NextAuth, 
        // fallback to standard '123456' using bcrypt 10 rounds if available, otherwise just require bcryptjs.
        const bcrypt = require('bcryptjs');
        const passHash = await bcrypt.hash('123456', 10);

        user = await prisma.user.create({
            data: {
                email,
                name: "Demo Admin",
                password: passHash,
                role: "ADMIN",
                tenantId
            }
        });
        console.log("Created user with 123456.");
    } else {
        tenantId = user.tenantId;
    }

    // Create DEMO Company
    let demoCompany = await prisma.company.findFirst({ where: { name: 'DEMO ŞİRKET', tenantId } });
    if (!demoCompany) {
        demoCompany = await prisma.company.create({
            data: {
                name: 'DEMO ŞİRKET',
                tenantId,
                vkn: '1111111111',
                taxNumber: '1111111111'
            }
        });
        await prisma.userCompanyAccess.create({
            data: {
                userId: user.id,
                companyId: demoCompany.id,
                role: 'ADMIN'
            }
        });
        console.log("Created DEMO ŞİRKET.");
    }

    const companyId = demoCompany.id;

    // Branches / Depots
    let demoBranch = await prisma.branch.findFirst({ where: { name: "DEMO ŞUBE", companyId } });
    if (!demoBranch) {
        demoBranch = await prisma.branch.create({
            data: { name: "DEMO ŞUBE", type: "Şube", companyId, status: "Active" }
        });
    }

    let demoDepot = await prisma.branch.findFirst({ where: { name: "DEMO DEPO", companyId } });
    if (!demoDepot) {
        demoDepot = await prisma.branch.create({
            data: { name: "DEMO DEPO", type: "Depo", companyId, status: "Active" }
        });
    }
    console.log("Created DEMO ŞUBE and DEMO DEPO.");

    // Kasalar
    const kasalar = [
        { name: "NAKİT", type: "Nakit", currency: "TRY", balance: 15000 },
        { name: "KREDİ KARTI", type: "Banka", currency: "TRY", balance: 45000 },
        { name: "HAVALE EFT", type: "Banka", currency: "TRY", balance: 80000 }
    ];
    for (const k of kasalar) {
        let kasa = await prisma.kasa.findFirst({ where: { name: k.name, companyId } });
        if (!kasa) {
            await prisma.kasa.create({
                data: { name: k.name, type: k.type, currency: k.currency, balance: k.balance, branch: "DEMO ŞUBE", companyId }
            });
        }
    }
    console.log("Created Kasalar.");

    // Müşteriler
    const customers = ["Ahmet Yılmaz", "Ayşe Demir", "Mehmet Kaya", "Fatma Çelik", "Mustafa Öztürk"];
    for (let pos = 0; pos < customers.length; pos++) {
        const c = customers[pos];
        let cust = await prisma.customer.findFirst({ where: { name: c, companyId } });
        if (!cust) {
            await prisma.customer.create({
                data: { companyId, name: c }
            });
        }
    }

    // Tedarikçiler
    const suppliers = ["Demir Makine A.Ş.", "Gelişim Tedarik", "Öncü Ticaret", "Mega Toptan", "Güven Lojistik"];
    for (let pos = 0; pos < suppliers.length; pos++) {
        const s = suppliers[pos];
        let supp = await prisma.supplier.findFirst({ where: { name: s, companyId } });
        if (!supp) {
            await prisma.supplier.create({
                data: { companyId, name: s, category: "Kurumsal" }
            });
        }
    }
    console.log("Created 5 Customers and 5 Suppliers.");

    // Ürünler
    const products = [
        { c: "PRD01", n: "Castrol Magnatec 10W-40", v: 850 },
        { c: "PRD02", n: "Mobil 1 ESP 5W-30", v: 1100 },
        { c: "PRD03", n: "Motul 8100 X-cess 5W-40", v: 1250 },
        { c: "PRD04", n: "Shell Helix Ultra 5W-40", v: 950 },
        { c: "PRD05", n: "Liqui Moly Top Tec 4100 5W-40", v: 1400 },
        { c: "PRD06", n: "Elf Evolution 900 SXR 5W-40", v: 750 },
        { c: "PRD07", n: "Total Quartz Ineo ECS 5W-30", v: 820 },
        { c: "PRD08", n: "Luqui Moly Ceratec", v: 450 },
        { c: "PRD09", n: "Bosch Hava Filtresi", v: 220 },
        { c: "PRD10", n: "Mann Yağ Filtresi", v: 180 }
    ];
    for (let pos = 0; pos < products.length; pos++) {
        const p = products[pos];
        let prd = await prisma.product.findFirst({ where: { code: p.c, companyId } });
        if (!prd) {
            await prisma.product.create({
                data: { code: p.c, name: p.n, companyId, buyPrice: p.v * 0.7, price: p.v * 1.2, salesVat: 20 }
            });
        }
    }
    console.log("Created 10 Products.");

    // Bayiler
    const pwHash = hashPassword("123456");
    for (let pos = 1; pos <= 2; pos++) {
        // Dealer User
        let dUser = await prisma.dealerUser.findUnique({ where: { email: `bayi${pos}@demo.com` } });
        if (!dUser) {
            dUser = await prisma.dealerUser.create({
                data: { email: `bayi${pos}@demo.com`, phone: `555000000${pos}`, passwordHash: pwHash }
            });
        }

        let dComp = await prisma.dealerCompany.findFirst({ where: { companyName: `Bayi ${pos} Ltd. Şti.` } });
        if (!dComp) {
            dComp = await prisma.dealerCompany.create({
                data: { companyName: `Bayi ${pos} Ltd. Şti.` }
            });
        }

        await prisma.dealerMembership.upsert({
            where: { dealerUserId_tenantId: { dealerUserId: dUser.id, tenantId } },
            update: {},
            create: { dealerUserId: dUser.id, dealerCompanyId: dComp.id, tenantId, status: "ACTIVE" }
        });
    }
    console.log("Created 2 Dealers (bayi1@demo.com, bayi2@demo.com pass: 123456).");

    // Staff
    const roles = ["Kasiyer", "Mağaza Müdürü", "Depo Uzmanı"];
    for (let pos = 0; pos < roles.length; pos++) {
        const r = roles[pos];
        const un = `personel${pos + 1}`;
        await prisma.staff.upsert({
            where: { username: un },
            update: { role: r, companyId },
            create: {
                username: un,
                name: `Demo ${r}`,
                role: r,
                companyId,
                status: "Aktif",
                branch: "DEMO ŞUBE",
                password: hashPassword("123456")
            }
        });
    }
    console.log("Created Staff for each role (personel1, personel2, personel3 - pass: 123456).");
    console.log("SEED COMPLETE!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
