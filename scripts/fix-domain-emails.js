const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Veritabanı Tarama Başlatıldı...\n');

    // 1. User Tablosu Kontrolü
    console.log('--- USER TABLOSU ---');
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, role: true }
        });
        console.log(`Toplam Kullanıcı: ${users.length}`);
        users.forEach(u => console.log(` - ${u.email} (${u.role})`));

        const kechUsers = users.filter(u => u.email && u.email.includes('kech.tr'));
        if (kechUsers.length > 0) {
            console.log('\n⚠️  GÜNCELLEME GEREKLİ (User):');
            for (const u of kechUsers) {
                const newEmail = u.email.replace('kech.tr', 'periodya.com');
                await prisma.user.update({
                    where: { id: u.id },
                    data: { email: newEmail }
                });
                console.log(` ✅ ${u.email} -> ${newEmail}`);
            }
        }
    } catch (e) {
        console.log('User tablosu erişim hatası:', e.message);
    }

    // 2. Staff Tablosu Kontrolü
    console.log('\n--- STAFF TABLOSU ---');
    try {
        const staff = await prisma.staff.findMany({
            select: { id: true, username: true, email: true, role: true }
        });
        console.log(`Toplam Personel: ${staff.length}`);
        staff.forEach(s => console.log(` - ${s.username} / ${s.email} (${s.role})`));

        const kechStaff = staff.filter(s => (s.email && s.email.includes('kech.tr')) || (s.username && s.username.includes('kech.tr')));
        if (kechStaff.length > 0) {
            console.log('\n⚠️  GÜNCELLEME GEREKLİ (Staff):');
            for (const s of kechStaff) {
                const newEmail = s.email ? s.email.replace('kech.tr', 'periodya.com') : s.email;
                const newUsername = s.username.includes('kech.tr') ? s.username.replace('kech.tr', 'periodya.com') : s.username;
                await prisma.staff.update({
                    where: { id: s.id },
                    data: {
                        email: newEmail,
                        username: newUsername
                    }
                });
                console.log(` ✅ ${s.username}/${s.email} -> ${newUsername}/${newEmail}`);
            }
        }
    } catch (e) {
        console.log('Staff tablosu erişim hatası:', e.message);
    }

    // 3. Mevcut Domain ve Ayarlar
    console.log('\n--- DİĞER AYARLAR ---');
    // Burada AppSettings vb. kontrol edilebilir

    console.log('\n🚀 Veritabanı güncelleme işlemi tamamlandı.');
}

main()
    .catch(e => console.error('Hata:', e))
    .finally(() => prisma.$disconnect());
