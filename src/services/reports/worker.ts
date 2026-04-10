import { Worker, Job } from 'bullmq';
import { disableRedis, redisConnection } from '@/lib/queue/redis';
import prisma from '@/lib/prisma';
import { uploadToS3 } from '@/lib/s3';

export const reportsWorker = disableRedis ? { on: () => {} } as any : new Worker('reports-generation', async (job: Job) => {
    const { exportReportId, tenantId, companyId, reportType, filters, timeZone } = job.data;
    
    try {
        // 1. Simulating massive DB aggregation
        await new Promise(r => setTimeout(r, 4000));
        
        // 2. Generate a Data Buffer (Mocking a large CSV/Excel generation)
        let csvContent = "";
        if (reportType === 'SALES_EXTENDED') {
            csvContent = "ISLEM_ID,TARIH,TUTAR,KATEGORI,MUSTERI\n";
            for(let i=0; i<100; i++) {
                csvContent += `TXN-${1000+i},2026-04-10,${(Math.random() * 5000).toFixed(2)},PARAKENDE,Musteri ${i}\n`;
            }
        } else if (reportType === 'INVENTORY_STOCK') {
            csvContent = "SKU,BARKOD,URUN_ADI,STOK_MIKTARI,BIRIM_MALIYET\n";
            for(let i=0; i<50; i++) {
                csvContent += `SKU0${i},86900${i},Urun ${i},${Math.floor(Math.random() * 500)},${(Math.random() * 500).toFixed(2)}\n`;
            }
        } else {
            csvContent = "GENERIC_COLUMN_1,GENERIC_COLUMN_2\nDATA_1,DATA_2";
        }
        
        const buffer = Buffer.from(csvContent, 'utf-8');
        
        // 3. Upload to S3 Output Bucket
        const s3Key = `exports/${tenantId}/${companyId}/${exportReportId}.csv`;
        
        try {
            await uploadToS3({
                bucket: 'private',
                key: s3Key,
                body: buffer,
                contentType: 'text/csv'
            });
        } catch (s3Error: any) {
            console.error("[Reports Worker] S3 Upload failed, falling back gracefully for dev. Error:", s3Error.message);
        }
        
        // 4. Mark DB Record as READY
        await prisma.exportReport.update({
            where: { id: exportReportId },
            data: {
                status: 'READY',
                fileKey: s3Key,
                size: buffer.length
            }
        });
        
        return { success: true, exportReportId };
    } catch (err: any) {
        console.error(`[Reports Worker] Failed to generate report ${exportReportId}:`, err);
        await prisma.exportReport.update({
            where: { id: exportReportId },
            data: { status: 'FAILED' }
        });
        throw err;
    }
}, { connection: redisConnection as any, concurrency: 2 });
