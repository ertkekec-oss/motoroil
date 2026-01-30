import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // 1. E-ticaret kategorisi
    const ecommerceCategory = await prisma.customerCategory.upsert({
        where: { name: 'E-ticaret' },
        update: {},
        create: {
            name: 'E-ticaret',
            description: 'Online pazaryerleri ve web sitesi müşterileri'
        }
    })
    console.log('✅ E-ticaret kategorisi hazır:', ecommerceCategory.id)

    // 2. Genel kategori
    const generalCategory = await prisma.customerCategory.upsert({
        where: { name: 'Genel' },
        update: {},
        create: {
            name: 'Genel',
            description: 'Genel perakende ve servis müşterileri'
        }
    })
    console.log('✅ Genel kategori hazır:', generalCategory.id)

    // 3. Mevcut müşterileri Genel kategoriye atayalım (Eğer kategorisi yoksa)
    const updatedCustomers = await prisma.customer.updateMany({
        where: { categoryId: null },
        data: { categoryId: generalCategory.id }
    })
    console.log(`✅ ${updatedCustomers.count} adet müşteriye Genel kategori atandı.`)

    // 4. Kasa kayıtları
    await prisma.kasa.upsert({
        where: { name: 'Merkez Kasa' },
        update: {},
        create: { name: 'Merkez Kasa', type: 'Nakit', balance: 0 }
    });
    await prisma.kasa.upsert({
        where: { name: 'E-ticaret' },
        update: {},
        create: { name: 'E-ticaret', type: 'Nakit', balance: 0 }
    });

    console.log('✅ Temel veriler (Seed) tamamlandı.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
