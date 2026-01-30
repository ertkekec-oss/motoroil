/**
 * Veritabanı Geri Yükleme Script
 * 
 * Kullanım:
 * node scripts/restore-backup.js checkpoints/backup_2026-01-30T20-12-00.json
 * 
 * UYARI: Bu işlem mevcut verileri SİLER ve yedekten geri yükler!
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function restoreBackup(backupFilePath) {
    console.log('🔄 Veritabanı geri yükleme başlatılıyor...');
    console.log(`📁 Yedek dosyası: ${backupFilePath}`);

    if (!fs.existsSync(backupFilePath)) {
        throw new Error(`Yedek dosyası bulunamadı: ${backupFilePath}`);
    }

    try {
        // Yedek dosyasını oku
        const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf-8'));

        console.log('\n📊 Yedek Bilgileri:');
        console.log(`  Tarih: ${backupData.metadata.timestamp}`);
        console.log(`  Versiyon: ${backupData.metadata.version}`);
        console.log(`  Checkpoint ID: ${backupData.metadata.checkpointId}`);

        // Onay iste
        console.log('\n⚠️  UYARI: Bu işlem mevcut tüm verileri silecek!');
        console.log('⚠️  Devam etmek için 10 saniye bekleniyor...');
        console.log('⚠️  İptal etmek için Ctrl+C yapın.\n');

        await new Promise(resolve => setTimeout(resolve, 10000));

        console.log('🗑️  Mevcut veriler temizleniyor...');

        // Sırayla tabloları temizle (foreign key constraints nedeniyle sıra önemli)
        await prisma.customerDocument.deleteMany();
        await prisma.marketplaceProductMap.deleteMany();
        await prisma.customerCategory.deleteMany();
        await prisma.appSettings.deleteMany();
        await prisma.inventoryAudit.deleteMany();
        await prisma.pendingTransfer.deleteMany();
        await prisma.pendingProduct.deleteMany();
        await prisma.notification.deleteMany();
        await prisma.securityEvent.deleteMany();
        await prisma.auditLog.deleteMany();
        await prisma.warranty.deleteMany();
        await prisma.coupon.deleteMany();
        await prisma.campaign.deleteMany();
        await prisma.stockTransfer.deleteMany();
        await prisma.serviceRecord.deleteMany();
        await prisma.order.deleteMany();
        await prisma.check.deleteMany();
        await prisma.purchaseInvoice.deleteMany();
        await prisma.salesInvoice.deleteMany();
        await prisma.transaction.deleteMany();
        await prisma.kasa.deleteMany();
        await prisma.supplier.deleteMany();
        await prisma.customer.deleteMany();
        await prisma.product.deleteMany();
        await prisma.branch.deleteMany();
        await prisma.staff.deleteMany();
        await prisma.user.deleteMany();
        await prisma.marketplaceConfig.deleteMany();

        console.log('✅ Temizleme tamamlandı');

        console.log('\n📥 Veriler geri yükleniyor...');

        // Sırayla verileri geri yükle
        const { data } = backupData;

        if (data.users?.length) {
            await prisma.user.createMany({ data: data.users });
            console.log(`  ✓ Users: ${data.users.length} kayıt`);
        }

        if (data.staff?.length) {
            await prisma.staff.createMany({ data: data.staff });
            console.log(`  ✓ Staff: ${data.staff.length} kayıt`);
        }

        if (data.branches?.length) {
            await prisma.branch.createMany({ data: data.branches });
            console.log(`  ✓ Branches: ${data.branches.length} kayıt`);
        }

        if (data.products?.length) {
            await prisma.product.createMany({ data: data.products });
            console.log(`  ✓ Products: ${data.products.length} kayıt`);
        }

        if (data.customerCategories?.length) {
            await prisma.customerCategory.createMany({ data: data.customerCategories });
            console.log(`  ✓ Customer Categories: ${data.customerCategories.length} kayıt`);
        }

        if (data.customers?.length) {
            await prisma.customer.createMany({ data: data.customers });
            console.log(`  ✓ Customers: ${data.customers.length} kayıt`);
        }

        if (data.suppliers?.length) {
            await prisma.supplier.createMany({ data: data.suppliers });
            console.log(`  ✓ Suppliers: ${data.suppliers.length} kayıt`);
        }

        if (data.kasalar?.length) {
            await prisma.kasa.createMany({ data: data.kasalar });
            console.log(`  ✓ Kasalar: ${data.kasalar.length} kayıt`);
        }

        if (data.transactions?.length) {
            await prisma.transaction.createMany({ data: data.transactions });
            console.log(`  ✓ Transactions: ${data.transactions.length} kayıt`);
        }

        if (data.salesInvoices?.length) {
            await prisma.salesInvoice.createMany({ data: data.salesInvoices });
            console.log(`  ✓ Sales Invoices: ${data.salesInvoices.length} kayıt`);
        }

        if (data.purchaseInvoices?.length) {
            await prisma.purchaseInvoice.createMany({ data: data.purchaseInvoices });
            console.log(`  ✓ Purchase Invoices: ${data.purchaseInvoices.length} kayıt`);
        }

        if (data.checks?.length) {
            await prisma.check.createMany({ data: data.checks });
            console.log(`  ✓ Checks: ${data.checks.length} kayıt`);
        }

        if (data.marketplaceConfigs?.length) {
            await prisma.marketplaceConfig.createMany({ data: data.marketplaceConfigs });
            console.log(`  ✓ Marketplace Configs: ${data.marketplaceConfigs.length} kayıt`);
        }

        if (data.orders?.length) {
            await prisma.order.createMany({ data: data.orders });
            console.log(`  ✓ Orders: ${data.orders.length} kayıt`);
        }

        if (data.serviceRecords?.length) {
            await prisma.serviceRecord.createMany({ data: data.serviceRecords });
            console.log(`  ✓ Service Records: ${data.serviceRecords.length} kayıt`);
        }

        if (data.stockTransfers?.length) {
            await prisma.stockTransfer.createMany({ data: data.stockTransfers });
            console.log(`  ✓ Stock Transfers: ${data.stockTransfers.length} kayıt`);
        }

        if (data.campaigns?.length) {
            await prisma.campaign.createMany({ data: data.campaigns });
            console.log(`  ✓ Campaigns: ${data.campaigns.length} kayıt`);
        }

        if (data.coupons?.length) {
            await prisma.coupon.createMany({ data: data.coupons });
            console.log(`  ✓ Coupons: ${data.coupons.length} kayıt`);
        }

        if (data.warranties?.length) {
            await prisma.warranty.createMany({ data: data.warranties });
            console.log(`  ✓ Warranties: ${data.warranties.length} kayıt`);
        }

        if (data.auditLogs?.length) {
            await prisma.auditLog.createMany({ data: data.auditLogs });
            console.log(`  ✓ Audit Logs: ${data.auditLogs.length} kayıt`);
        }

        if (data.securityEvents?.length) {
            await prisma.securityEvent.createMany({ data: data.securityEvents });
            console.log(`  ✓ Security Events: ${data.securityEvents.length} kayıt`);
        }

        if (data.notifications?.length) {
            await prisma.notification.createMany({ data: data.notifications });
            console.log(`  ✓ Notifications: ${data.notifications.length} kayıt`);
        }

        if (data.pendingProducts?.length) {
            await prisma.pendingProduct.createMany({ data: data.pendingProducts });
            console.log(`  ✓ Pending Products: ${data.pendingProducts.length} kayıt`);
        }

        if (data.pendingTransfers?.length) {
            await prisma.pendingTransfer.createMany({ data: data.pendingTransfers });
            console.log(`  ✓ Pending Transfers: ${data.pendingTransfers.length} kayıt`);
        }

        if (data.inventoryAudits?.length) {
            await prisma.inventoryAudit.createMany({ data: data.inventoryAudits });
            console.log(`  ✓ Inventory Audits: ${data.inventoryAudits.length} kayıt`);
        }

        if (data.appSettings?.length) {
            await prisma.appSettings.createMany({ data: data.appSettings });
            console.log(`  ✓ App Settings: ${data.appSettings.length} kayıt`);
        }

        if (data.marketplaceProductMaps?.length) {
            await prisma.marketplaceProductMap.createMany({ data: data.marketplaceProductMaps });
            console.log(`  ✓ Marketplace Product Maps: ${data.marketplaceProductMaps.length} kayıt`);
        }

        if (data.customerDocuments?.length) {
            await prisma.customerDocument.createMany({ data: data.customerDocuments });
            console.log(`  ✓ Customer Documents: ${data.customerDocuments.length} kayıt`);
        }

        console.log('\n✅ Geri yükleme tamamlandı!');
        console.log('🎉 Veritabanı başarıyla geri yüklendi.');

        return {
            success: true,
            stats: backupData.metadata.stats,
        };
    } catch (error) {
        console.error('❌ Geri yükleme hatası:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Script olarak çalıştırıldığında
if (require.main === module) {
    const backupFile = process.argv[2];

    if (!backupFile) {
        console.error('❌ Hata: Yedek dosyası belirtilmedi!');
        console.log('\nKullanım:');
        console.log('  node scripts/restore-backup.js checkpoints/backup_2026-01-30T20-12-00.json');
        process.exit(1);
    }

    const fullPath = path.isAbsolute(backupFile)
        ? backupFile
        : path.join(__dirname, '..', backupFile);

    restoreBackup(fullPath)
        .then(() => {
            console.log('\n🎉 İşlem başarıyla tamamlandı!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Kritik hata:', error);
            process.exit(1);
        });
}

module.exports = { restoreBackup };
