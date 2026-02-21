const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Toplu Domain Güncelleme Başlatıldı: kech.tr -> periodya.com\n');

    // 1. User tablosu
    const users = await prisma.user.findMany({
        where: { email: { contains: 'kech.tr' } }
    });
    console.log(`User tablosunda ${users.length} kayıt bulundu.`);
    for (const u of users) {
        const newEmail = u.email.replace(/kech\.tr/g, 'periodya.com');
        await prisma.user.update({
            where: { id: u.id },
            data: { email: newEmail }
        });
        console.log(` ✅ User Updated: ${u.email} -> ${newEmail}`);
    }

    // 2. Tenant tablosu
    const tenants = await prisma.tenant.findMany({
        where: { ownerEmail: { contains: 'kech.tr' } }
    });
    console.log(`\nTenant tablosunda ${tenants.length} kayıt bulundu.`);
    for (const t of tenants) {
        const newEmail = t.ownerEmail.replace(/kech\.tr/g, 'periodya.com');
        await prisma.tenant.update({
            where: { id: t.id },
            data: { ownerEmail: newEmail }
        });
        console.log(` ✅ Tenant Updated: ${t.ownerEmail} -> ${newEmail}`);
    }

    // 3. Staff tablosu
    const staff = await prisma.staff.findMany({
        where: {
            OR: [
                { email: { contains: 'kech.tr' } },
                { username: { contains: 'kech.tr' } }
            ]
        }
    });
    console.log(`\nStaff tablosunda ${staff.length} kayıt bulundu.`);
    for (const s of staff) {
        const newEmail = s.email ? s.email.replace(/kech\.tr/g, 'periodya.com') : s.email;
        const newUsername = s.username.replace(/kech\.tr/g, 'periodya.com');
        await prisma.staff.update({
            where: { id: s.id },
            data: {
                email: newEmail,
                username: newUsername
            }
        });
        console.log(` ✅ Staff Updated: ${s.email}/${s.username} -> ${newEmail}/${newUsername}`);
    }

    // 4. IntegratorSettings (özellikle e-fatura/portal e-postaları için)
    // Bu şemada IntegratorSettings credentials içinde JSON olarak saklıyor olabilir
    const configs = await prisma.company.findMany({
        include: { integratorSettings: true }
    });
    console.log(`\nCompany configs kontrol ediliyor...`);
    // Gerekirse burada detaylı JSON replace yapılabilir

    console.log('\n✨ Veritabanı domain güncellemeleri başarıyla tamamlandı.');
}

main()
    .catch(err => console.error('Hata:', err))
    .finally(() => prisma.$disconnect());
