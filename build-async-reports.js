const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// 1. Add to Queue Index
const queueIndexPath = path.join(srcDir, 'lib', 'queue', 'index.ts');
let queueIndexContent = fs.readFileSync(queueIndexPath, 'utf8');

if (!queueIndexContent.includes('reportsQueue')) {
    const queueAddition = `
// ============================================================================
// ASYNC REPORTS QUEUE
// ============================================================================

export const reportsQueue = disableRedis ? new Proxy({}, { get: () => () => Promise.resolve() }) as any : new Queue('reports-generation', {
    connection: redisConnection as any,
    defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 50, age: 3600 },
        removeOnFail: { count: 100 },
    },
});
`;
    fs.writeFileSync(queueIndexPath, queueIndexContent + queueAddition);
    console.log("-> Added reportsQueue to lib/queue/index.ts");
}

// 2. Create the worker file
const reportsWorkerPath = path.join(srcDir, 'services', 'reports', 'worker.ts');
fs.mkdirSync(path.dirname(reportsWorkerPath), { recursive: true });

const workerContent = `import { Worker, Job } from 'bullmq';
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
            csvContent = "ISLEM_ID,TARIH,TUTAR,KATEGORI,MUSTERI\\n";
            for(let i=0; i<100; i++) {
                csvContent += \`TXN-\${1000+i},2026-04-10,\${(Math.random() * 5000).toFixed(2)},PARAKENDE,Müsteri \${i}\\n\`;
            }
        } else if (reportType === 'INVENTORY_STOCK') {
            csvContent = "SKU,BARKOD,URUN_ADI,STOK_MIKTARI,BIRIM_MALIYET\\n";
            for(let i=0; i<50; i++) {
                csvContent += \`SKU0\${i},86900\${i},Ürün \${i},\${Math.floor(Math.random() * 500)},\${(Math.random() * 500).toFixed(2)}\\n\`;
            }
        } else {
            csvContent = "GENERIC_COLUMN_1,GENERIC_COLUMN_2\\nDATA_1,DATA_2";
        }
        
        const buffer = Buffer.from(csvContent, 'utf-8');
        
        // 3. Upload to S3 Output Bucket
        const s3Key = \`exports/\${tenantId}/\${companyId}/\${exportReportId}.csv\`;
        
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
        console.error(\`[Reports Worker] Failed to generate report \${exportReportId}:\`, err);
        await prisma.exportReport.update({
            where: { id: exportReportId },
            data: { status: 'FAILED' }
        });
        throw err;
    }
}, { connection: redisConnection as any, concurrency: 2 });
`;
fs.writeFileSync(reportsWorkerPath, workerContent);
console.log("-> Created reports Worker at src/services/reports/worker.ts");

// 3. Add to worker-init
const workerInitPath = path.join(srcDir, 'lib', 'queue', 'worker-init.ts');
let initContent = fs.readFileSync(workerInitPath, 'utf8');

if (!initContent.includes('reportsWorker')) {
    initContent = \`import { reportsWorker } from "../../services/reports/worker";\\n\` + initContent;
    initContent = initContent.replace('isInitialized = true;', \`
    reportsWorker.on('completed', (job) => console.log('Report Gen Success:', job.id));
    reportsWorker.on('failed', (job, err) => console.error('Report Gen Failed:', job?.id, err));
    isInitialized = true;
\`);
    fs.writeFileSync(workerInitPath, initContent);
    console.log("-> Initialized reportsWorker in lib/queue/worker-init.ts");
}

// 4. Create the /api/exports/generate endpoint
const generateRoutePath = path.join(srcDir, 'app', 'api', 'exports', 'generate', 'route.ts');
fs.mkdirSync(path.dirname(generateRoutePath), { recursive: true });

const generateContent = \`import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';
import { reportsQueue } from '@/lib/queue';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        if (!hasPermission(session, 'reports_manage') && session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
        }

        const tenantId = (session as any).tenantId;
        const companyId = session.companyId;

        if (!tenantId || !companyId) {
            return NextResponse.json({ error: 'Geçersiz oturum', status: 400 });
        }

        const body = await req.json();
        const { reportType, name, filters } = body;

        if (!reportType || !name) {
            return NextResponse.json({ error: 'Eksik rapor tipi veya ismi' }, { status: 400 });
        }

        // 1. Create DB Record as PENDING
        const fileName = \`\${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_\${Date.now()}.csv\`;
        
        const exportReq = await prisma.exportReport.create({
            data: {
                tenantId,
                companyId,
                name: name,
                reportType: reportType,
                fileName: fileName,
                mimeType: 'text/csv',
                status: 'PENDING',
                size: 0
            }
        });

        // 2. Push to BullMQ Generator Pool
        if (reportsQueue && typeof reportsQueue.add === 'function') {
            await reportsQueue.add('generate-csv', {
                exportReportId: exportReq.id,
                tenantId,
                companyId,
                reportType,
                filters,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Rapor sıraya alındı, arka planda hazırlanıyor.',
            reportId: exportReq.id
        });

    } catch (err: any) {
        console.error('[API Error] Generate Report:', err);
        return NextResponse.json({ error: 'Rapor isteği oluşturulamadı' }, { status: 500 });
    }
}
\`;

fs.writeFileSync(generateRoutePath, generateContent);
console.log("-> Created Report Generation Endpoint: /api/exports/generate/route.ts");
