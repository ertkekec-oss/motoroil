/**
 * Veritabanı Yedekleme Script
 * 
 * Kullanım:
 * node scripts/create-backup.js
 * 
 * Bu script:
 * 1. Tüm veritabanı tablolarını export eder
 * 2. JSON formatında yedek oluşturur
 * 3. checkpoints/ klasörüne kaydeder
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function createBackup() {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupDir = path.join(__dirname, '../checkpoints');
    const backupFile = path.join(backupDir, `backup_${timestamp}.json`);

    console.log('🔄 Veritabanı yedekleme başlatılıyor...');
    console.log(`📁 Yedek dosyası: ${backupFile}`);

    try {
        // Tüm verileri çek
        const backup = {
            metadata: {
                timestamp: new Date().toISOString(),
                version: '4.2.0',
                checkpointId: `BACKUP_${timestamp}`,
            },
            data: {
                users: await prisma.user.findMany(),
                staff: await prisma.staff.findMany(),
                branches: await prisma.branch.findMany(),
                products: await prisma.product.findMany(),
                customers: await prisma.customer.findMany(),
                suppliers: await prisma.supplier.findMany(),
                kasalar: await prisma.kasa.findMany(),
                transactions: await prisma.transaction.findMany(),
                salesInvoices: await prisma.salesInvoice.findMany(),
                purchaseInvoices: await prisma.purchaseInvoice.findMany(),
                checks: await prisma.check.findMany(),
                orders: await prisma.order.findMany(),
                serviceRecords: await prisma.serviceRecord.findMany(),
                stockTransfers: await prisma.stockTransfer.findMany(),
                campaigns: await prisma.campaign.findMany(),
                coupons: await prisma.coupon.findMany(),
                warranties: await prisma.warranty.findMany(),
                auditLogs: await prisma.auditLog.findMany(),
                securityEvents: await prisma.securityEvent.findMany(),
                notifications: await prisma.notification.findMany(),
                pendingProducts: await prisma.pendingProduct.findMany(),
                pendingTransfers: await prisma.pendingTransfer.findMany(),
                inventoryAudits: await prisma.inventoryAudit.findMany(),
                appSettings: await prisma.appSettings.findMany(),
                marketplaceConfigs: await prisma.marketplaceConfig.findMany(),
                marketplaceProductMaps: await prisma.marketplaceProductMap.findMany(),
                customerCategories: await prisma.customerCategory.findMany(),
                customerDocuments: await prisma.customerDocument.findMany(),
            },
        };

        // İstatistikler
        const stats = {
            users: backup.data.users.length,
            staff: backup.data.staff.length,
            branches: backup.data.branches.length,
            products: backup.data.products.length,
            customers: backup.data.customers.length,
            suppliers: backup.data.suppliers.length,
            kasalar: backup.data.kasalar.length,
            transactions: backup.data.transactions.length,
            salesInvoices: backup.data.salesInvoices.length,
            purchaseInvoices: backup.data.purchaseInvoices.length,
            checks: backup.data.checks.length,
            orders: backup.data.orders.length,
            serviceRecords: backup.data.serviceRecords.length,
            stockTransfers: backup.data.stockTransfers.length,
            campaigns: backup.data.campaigns.length,
            coupons: backup.data.coupons.length,
            warranties: backup.data.warranties.length,
            auditLogs: backup.data.auditLogs.length,
            securityEvents: backup.data.securityEvents.length,
            notifications: backup.data.notifications.length,
            pendingProducts: backup.data.pendingProducts.length,
            pendingTransfers: backup.data.pendingTransfers.length,
            inventoryAudits: backup.data.inventoryAudits.length,
            appSettings: backup.data.appSettings.length,
            marketplaceConfigs: backup.data.marketplaceConfigs.length,
            marketplaceProductMaps: backup.data.marketplaceProductMaps.length,
            customerCategories: backup.data.customerCategories.length,
            customerDocuments: backup.data.customerDocuments.length,
        };

        backup.metadata.stats = stats;

        // Dosyaya yaz
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2), 'utf-8');

        console.log('\n✅ Yedekleme tamamlandı!');
        console.log('\n📊 İstatistikler:');
        console.log('─'.repeat(50));
        Object.entries(stats).forEach(([key, value]) => {
            console.log(`  ${key.padEnd(25)} : ${value.toString().padStart(6)} kayıt`);
        });
        console.log('─'.repeat(50));

        const fileSizeMB = (fs.statSync(backupFile).size / 1024 / 1024).toFixed(2);
        console.log(`\n💾 Dosya boyutu: ${fileSizeMB} MB`);
        console.log(`📁 Konum: ${backupFile}`);

        return {
            success: true,
            file: backupFile,
            stats,
            sizeMB: fileSizeMB,
        };
    } catch (error) {
        console.error('❌ Yedekleme hatası:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Script olarak çalıştırıldığında
if (require.main === module) {
    createBackup()
        .then(() => {
            console.log('\n🎉 İşlem başarıyla tamamlandı!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Kritik hata:', error);
            process.exit(1);
        });
}

module.exports = { createBackup };
