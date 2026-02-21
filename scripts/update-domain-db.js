/**
 * Production DB'deki domain değişikliklerini kontrol ve güncelleme scripti
 * .env dosyasındaki DATABASE_URL'i kullanır (production Neon DB)
 */

// .env dosyasından production DATABASE_URL'i oku
const fs = require('fs');
const path = require('path');

// .env dosyasını oku
function loadEnv(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const vars = {};
        content.split('\n').forEach(function (line) {
            line = line.trim();
            if (line && !line.startsWith('#')) {
                const eqIdx = line.indexOf('=');
                if (eqIdx > 0) {
                    const key = line.substring(0, eqIdx).trim();
                    let value = line.substring(eqIdx + 1).trim();
                    // Tırnakları kaldır
                    if ((value.startsWith('"') && value.endsWith('"')) ||
                        (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.slice(1, -1);
                    }
                    vars[key] = value;
                }
            }
        });
        return vars;
    } catch (e) {
        return {};
    }
}

const rootDir = path.join(__dirname, '..');

// Önce .env.local dene (en yüksek öncelik), yoksa .env
const envLocal = loadEnv(path.join(rootDir, '.env.local'));
const envFile = loadEnv(path.join(rootDir, '.env'));

const dbUrl = envLocal.DATABASE_URL || envFile.DATABASE_URL;

if (!dbUrl || dbUrl.includes('kullanici')) {
    console.error('❌ Geçerli DATABASE_URL bulunamadı!');
    console.log('Mevcut .env DATABASE_URL:', envFile.DATABASE_URL ? envFile.DATABASE_URL.substring(0, 50) + '...' : 'YOK');
    console.log('Mevcut .env.local DATABASE_URL:', envLocal.DATABASE_URL || 'YOK');
    process.exit(1);
}

console.log('✅ DB URL bulundu:', dbUrl.substring(0, 60) + '...');

// DATABASE_URL'i set et
process.env.DATABASE_URL = dbUrl;

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('\n=== VERİTABANI DOMAIN GÜNCELLEMESİ ===\n');

    // Staff tablosundaki kech.tr emaillerini bul
    console.log('1️⃣  Staff tablosunda kech.tr arama...');
    const kechStaff = await prisma.staff.findMany({
        where: {
            OR: [
                { email: { contains: 'kech.tr' } },
                { username: { contains: 'kech.tr' } }
            ]
        },
        select: { id: true, username: true, email: true, role: true }
    });

    console.log('   Bulunan kayıt sayısı:', kechStaff.length);

    if (kechStaff.length > 0) {
        for (var s of kechStaff) {
            console.log('   Güncelleniyor:', s.username, '|', s.email);
            const newEmail = s.email ? s.email.replace(/kech\.tr/g, 'periodya.com') : s.email;
            const newUsername = s.username ? s.username.replace(/kech\.tr/g, 'periodya.com') : s.username;
            await prisma.staff.update({
                where: { id: s.id },
                data: {
                    email: newEmail,
                    username: newUsername
                }
            });
            console.log('   ✅ Güncellendi:', newUsername, '|', newEmail);
        }
    } else {
        console.log('   ℹ️  kech.tr içeren staff bulunamadı ya da zaten güncellenmiş');
    }

    // Tüm admin/super admin staffları listele
    console.log('\n2️⃣  Güncel admin listesi:');
    const admins = await prisma.staff.findMany({
        where: {
            role: { in: ['SUPER_ADMIN', 'ADMIN'] }
        },
        select: { id: true, username: true, email: true, role: true }
    });

    if (admins.length === 0) {
        console.log('   ⚠️  UYARI: Hiç admin bulunamadı! Toplam staff sayısını kontrol ediyorum...');
        const total = await prisma.staff.count();
        console.log('   Toplam staff sayısı:', total);

        if (total === 0) {
            console.log('   ❌ Hiç staff yok! Bu local DB, NOT production DB!');
        }
    } else {
        for (var a of admins) {
            console.log('   👤', a.username, '|', a.email, '|', a.role);
        }
    }

    console.log('\n✅ İşlem tamamlandı!');
}

main().catch(function (e) {
    console.error('HATA:', e.message);
}).finally(function () {
    return prisma.$disconnect();
});
