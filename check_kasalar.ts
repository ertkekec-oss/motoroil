
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const totalCount = await prisma.kasa.count();
    console.log('Toplam Kasa Sayısı:', totalCount);

    if (totalCount > 0) {
        const first5 = await prisma.kasa.findMany({ take: 5 });
        console.log('İlk 5 Kasa:', JSON.stringify(first5, null, 2));
    }

    // Arama: Adı veya Şubesi 'ANTALYA' içerenler
    const kasalar = await prisma.kasa.findMany({
        where: {
            OR: [
                { name: { contains: 'ANTALYA', mode: 'insensitive' } },
                { branch: { contains: 'ANTALYA', mode: 'insensitive' } }
            ]
        }
    });
    console.log('Bulunan Kasalar:', JSON.stringify(kasalar, null, 2));

    // Tüm mevcut şubeleri listele
    const allBranches = await prisma.kasa.findMany({
        select: { branch: true },
        distinct: ['branch']
    });
    console.log('Mevcut Kasa Şubeleri:', allBranches.map(k => k.branch));

    // Branch tablosunu kontrol et
    const branchTable = await prisma.branch.findMany();
    console.log('Branch Tablosundaki Şubeler:', JSON.stringify(branchTable, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
