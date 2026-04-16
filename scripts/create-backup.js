/**
 * Veritabanı Yedekleme Script
 * 
 * Dinamik model bulma özelliği ile güncellendi.
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
        // Find all models dynamically from prisma object
        // They are lowercase getters
        const models = Object.getOwnPropertyNames(prisma).filter(key => 
            !key.startsWith('_') && 
            !key.startsWith('$') && 
            typeof prisma[key]?.findMany === 'function'
        );

        console.log(`🔍 Toplam ${models.length} tablo bulundu. Veriler çekiliyor...`);

        const backupData = {};
        const stats = {};

        for (const model of models) {
            try {
                const records = await prisma[model].findMany();
                backupData[model] = records;
                stats[model] = records.length;
            } catch (e) {
                console.warn(`⚠️ Warning: ${model} modeli atlandı. (${e.message.split('\\n')[0]})`);
            }
        }

        const backup = {
            metadata: {
                timestamp: new Date().toISOString(),
                version: '4.2.0-dynamic',
                checkpointId: `BACKUP_${timestamp}`,
                stats
            },
            data: backupData
        };

        // Dosyaya yaz
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2), 'utf-8');

        console.log('\n✅ Yedekleme tamamlandı!');
        console.log('\n📊 İstatistikler:');
        console.log('─'.repeat(50));
        
        // Tabloları kayıt sayısına göre sırala (büyükten küçüğe)
        const sortedModels = Object.entries(stats).sort((a, b) => b[1] - a[1]);
        
        sortedModels.forEach(([key, value]) => {
            if (value > 0) {
                console.log(`  ${key.padEnd(30)} : ${value.toString().padStart(6)} kayıt`);
            }
        });
        
        const emptyCount = sortedModels.filter(m => m[1] === 0).length;
        if (emptyCount > 0) {
             console.log(`  (Diğer ${emptyCount} tablo boştur)`);
        }
        
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
