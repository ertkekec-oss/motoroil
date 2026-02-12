import { PrismaClient } from '@prisma/client';
import { ActionProviderRegistry } from '../src/services/marketplaces/actions/registry';
import { initMarketplaceWorker } from '../src/lib/queue/worker-init';
import process from 'node:process';

const prisma = new PrismaClient();

// Barrier: Tüm promise'leri aynı anda yarıştırmak için
function createBarrier() {
    let release: any;
    const gate = new Promise((res) => (release = res));
    return { gate, release };
}

async function runCanary() {
    console.log('🧪 Canary Test: ASYNC Queue & Race Condition');

    // Initialize background worker for the script
    initMarketplaceWorker();

    // 1) Test Datası Hazırla
    const company = await prisma.company.findFirst({ select: { id: true } });
    if (!company) throw new Error('Test için Company bulunamadı.');

    const order = await prisma.order.findFirst({
        where: { companyId: company.id },
        select: { id: true },
    });
    if (!order) throw new Error('Test için Order bulunamadı.');

    const provider = ActionProviderRegistry.getProvider('trendyol');
    const testKey = `CANARY_ASYNC_${Date.now()}`;

    const input = {
        companyId: company.id,
        marketplace: 'trendyol' as const,
        orderId: order.id,
        actionKey: 'REFRESH_STATUS' as const,
        idempotencyKey: testKey,
    };

    // 2) Concurrency Ayarları
    const CONCURRENCY = Number(process.env.CANARY_N || 10);
    console.log(`📡 Senaryo: Aynı key (${testKey}) ile ${CONCURRENCY} concurrent istek başlıyor...`);

    const { gate, release } = createBarrier();

    const tasks = Array.from({ length: CONCURRENCY }).map((_, i) => (async () => {
        await gate;
        try {
            const r = await provider.executeAction(input);
            return { ok: true, i, r };
        } catch (e: any) {
            return { ok: false, i, e: e.message };
        }
    })());

    const t0 = Date.now();
    release(); // Ateşle!
    const results = await Promise.all(tasks);
    const dt = Date.now() - t0;

    console.log(`⏱️ Tüm istekler ${dt}ms içinde tamamlandı (API seviyesi).`);

    // 3) Polling for Worker Result
    console.log('⏳ Worker işleminin tamamlanması bekleniyor (polling)...');
    let finalAudit: any = null;
    const maxAttempts = 20;

    for (let i = 0; i < maxAttempts; i++) {
        finalAudit = await (prisma as any).marketplaceActionAudit.findUnique({
            where: { idempotencyKey: testKey }
        });

        if (finalAudit && finalAudit.status !== 'PENDING') break;
        await new Promise(r => setTimeout(r, 1000));
    }

    // 4) Doğrulama
    const auditRecords = await prisma.marketplaceActionAudit.findMany({
        where: { idempotencyKey: testKey }
    });

    const okCount = results.filter(x => x.ok).length;
    const statuses = results.map(x => x.r?.status);

    console.log('\n📊 Async Test Analizi');
    console.log(`- API Dönen Statuslar:`, [...new Set(statuses)]);
    console.log(`- DB Kayıt Sayısı: ${auditRecords.length} (BEKLENEN: 1)`);
    console.log(`- Final Status: ${finalAudit?.status} (BEKLENEN: SUCCESS)`);

    const pass =
        auditRecords.length === 1 &&
        finalAudit?.status === 'SUCCESS' &&
        results.every(x => x.ok);

    if (pass) {
        console.log('\n✅ PASS: Async queue ve idempotency yüksek yük altında kanıtlandı.');
    } else {
        console.error('\n❌ FAIL: Async kriterleri sağlanmadı!');
        process.exit(1);
    }
}

runCanary()
    .catch(e => {
        console.error('❌ Canary Crash:', e);
        process.exit(1);
    })
    .finally(() => {
        // We don't disconnect immediately because worker needs it? 
        // Actually worker uses its own connection but prisma is shared.
        setTimeout(() => prisma.$disconnect().then(() => process.exit(0)), 5000);
    });
