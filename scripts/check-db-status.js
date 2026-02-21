const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('=== STAFF TABLOSU ===');
    const allStaff = await prisma.staff.findMany({
        select: { id: true, username: true, email: true, role: true, tenantId: true }
    });
    console.log('Toplam staff:', allStaff.length);
    allStaff.forEach(function (s) {
        console.log('  -', s.username, '|', s.email, '|', s.role, '| tenant:', s.tenantId);
    });

    console.log('\n=== TENANT TABLOSU ===');
    var tenants = await prisma.tenant.findMany({
        select: { id: true, name: true, slug: true }
    });
    console.log('Toplam tenant:', tenants.length);
    tenants.forEach(function (t) {
        console.log('  -', t.name, '|', t.slug, '|', t.id);
    });

    console.log('\n=== COMPANY TABLOSU ===');
    var companies = await prisma.company.findMany({
        select: { id: true, name: true }
    });
    console.log('Toplam company:', companies.length);
    companies.forEach(function (c) {
        console.log('  -', c.name, '|', c.id);
    });

    console.log('\n=== USER TABLOSU ===');
    try {
        var users = await prisma.user.findMany({
            select: { id: true, email: true, role: true }
        });
        console.log('Toplam user:', users.length);
        users.forEach(function (u) {
            console.log('  -', u.email, '|', u.role);
        });
    } catch (e) {
        console.log('User tablosu yok:', e.message.substring(0, 100));
    }
}

main().catch(function (e) { console.error('HATA:', e.message.substring(0, 200)); }).finally(function () { return prisma.$disconnect(); });
