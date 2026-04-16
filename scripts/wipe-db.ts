// @ts-nocheck
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🚀 Tüm demo verileri siliniyor...')

    try {
        await prisma.$transaction(async (tx) => {
            // Finansal Modeller
            await tx.journalItem.deleteMany({})
            await tx.journal.deleteMany({})
            await tx.account.deleteMany({})
            await tx.installment.deleteMany({})
            await tx.paymentPlan.deleteMany({})
            await tx.transaction.deleteMany({})
            await tx.check.deleteMany({})

            // Satış & Stok
            await tx.stockMovement.deleteMany({})
            await tx.stockTransfer.deleteMany({})
            await tx.inventoryAudit.deleteMany({})
            await tx.stock.deleteMany({})
            await tx.salesInvoice.deleteMany({})
            await tx.purchaseInvoice.deleteMany({})
            await tx.order.deleteMany({})
            await tx.suspendedSale.deleteMany({})
            await tx.serviceRecord.deleteMany({})

            // Ürün & Müşteri
            await tx.marketplaceProductMap.deleteMany({})
            await tx.product.deleteMany({})
            await tx.warranty.deleteMany({})
            await tx.coupon.deleteMany({})
            await tx.customerDocument.deleteMany({})
            await tx.customer.deleteMany({})
            await tx.customerCategory.deleteMany({})
            await tx.supplier.deleteMany({})

            // Diğer
            await tx.auditLog.deleteMany({})
            await tx.notification.deleteMany({})
            await tx.securityEvent.deleteMany({})
            await tx.kasa.deleteMany({})

            // Şube (Merkez hariç)
            await tx.branchDocument.deleteMany({})
            await tx.branch.deleteMany({ where: { NOT: { name: 'Merkez' } } })
        })

        console.log('✅ Veriler temizlendi. Temel tanımlar (Seed) yükleniyor...')

        const firstCompany = await prisma.company.findFirst();
        if (!firstCompany) {
            console.log('⚠️ Hiç şirket bulunamadı, seed atlanıyor.');
            return;
        }

        // Yeniden seed yapalım (Merkez Kasa vb. geri gelsin)
        // 1. Genel kategori
        await prisma.customerCategory.upsert({
            where: {
                companyId_name: {
                    companyId: firstCompany.id,
                    name: 'Genel'
                }
            },
            update: {},
            create: {
                companyId: firstCompany.id,
                name: 'Genel',
                description: 'Genel perakende ve servis müşterileri'
            }
        })

        // 2. Kasa kayıtları
        await prisma.kasa.upsert({
            where: {
                name_branch_companyId: {
                    name: 'Merkez Kasa',
                    branch: 'Merkez',
                    companyId: firstCompany.id
                }
            },
            update: {},
            create: {
                name: 'Merkez Kasa',
                type: 'Nakit',
                balance: 0,
                branch: 'Merkez',
                companyId: firstCompany.id
            }
        });

        console.log('✨ Sistem sıfırlandı ve hazır.')
    } catch (error) {
        console.error('❌ Hata:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()

