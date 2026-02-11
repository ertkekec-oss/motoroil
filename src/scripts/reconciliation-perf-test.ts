import { PrismaClient } from '@prisma/client';
import { SettlementReconciliationEngine } from '../services/fintech/settlement-reconciliation-engine';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function prepareData(count: number, companyId: string) {
    console.log(`\n🏗 Preparing ${count} records for stress test...`);

    const statementsData = [];
    const journalEntriesData = [];

    // For bulk speed, we'll do them in chunks
    const chunkSize = 1000;
    const journalIds: string[] = [];

    const entriesToCreate = Array.from({ length: count }).map((_, i) => ({
        id: `test-je-${i}-${Math.random().toString(36).substring(7)}`,
        companyId,
        sourceEventId: `test-event-${i}-${Math.random().toString(36).substring(7)}`,
        description: `Stress Test Entry`
    }));

    await (prisma as any).journalEntry.createMany({ data: entriesToCreate });
    console.log(`   ✅ ${count} JournalEntry headers created.`);

    const linesToCreate = entriesToCreate.map((e) => ({
        journalEntryId: e.id,
        accountCode: '120.03',
        debit: 0,
        credit: new Decimal(100),
        companyId,
        isOpen: true
    }));

    // Find a real account for 120.03 to avoid errors if we were using relations, 
    // but JournalLine in schema doesn't have a direct FK to Account (it uses accountCode string)
    // Actually, JournalLine in schema: accountCode: String

    await (prisma as any).journalLine.createMany({ data: linesToCreate });
    console.log(`   ✅ ${count} JournalLine records created.`);

    // Creating Bank Statements
    const statementsToCreate = Array.from({ length: count }).map((_, i) => ({
        companyId,
        bankAccountCode: '102.01',
        statementDate: new Date(),
        referenceNo: `STRESS-${i}-${Math.random().toString(36).substring(7)}`,
        description: 'Bulk Test',
        debit: new Decimal(0),
        credit: new Decimal(100),
        isMatched: false
    }));

    await (prisma as any).bankStatement.createMany({ data: statementsToCreate });
    console.log(`   ✅ ${count} Bank statements created.`);

    const allStatements = await (prisma as any).bankStatement.findMany({
        where: { referenceNo: { startsWith: 'STRESS-' } },
        select: { id: true }
    });

    return allStatements.map((s: any) => s.id);
}

async function runStressTest(statementIds: string[]) {
    console.log(`\n🚀 Starting Stress Test with ${statementIds.length} transactions...`);
    const startTime = Date.now();
    const concurrency = 10; // Safer concurrency for Neon pool
    let processed = 0;
    const errors: any[] = [];

    const chunks = [];
    for (let i = 0; i < statementIds.length; i += concurrency) {
        chunks.push(statementIds.slice(i, i + concurrency));
    }

    for (const chunk of chunks) {
        await Promise.all(
            chunk.map(async (id) => {
                try {
                    await SettlementReconciliationEngine.reconcileBankStatement(id);
                    processed++;
                } catch (e: any) {
                    errors.push(e);
                }
            })
        );
        if (processed % 100 === 0) {
            const elapsed = (Date.now() - startTime) / 1000;
            const rps = (processed / elapsed).toFixed(2);
            console.log(`   📊 Processed: ${processed}/${statementIds.length} | Speed: ${rps} ops/sec`);
        }
    }

    const totalTime = Date.now() - startTime;
    return {
        totalTime,
        processed,
        errors,
        avgTime: totalTime / processed
    };
}

async function main() {
    const company = await prisma.company.findFirst();
    if (!company) throw new Error("No company found");

    // Cleanup first
    console.log('🧹 Cleaning up old stress test data...');
    await (prisma as any).bankStatement.deleteMany({ where: { referenceNo: { startsWith: 'STRESS-' } } });
    await (prisma as any).journalEntry.deleteMany({ where: { description: { startsWith: 'Stress Test Entry' } } });

    const count = 2000; // Increased for better stress indicator
    const statementIds = await prepareData(count, company.id);

    const report = await runStressTest(statementIds);

    console.log('\n--- PERFORMANCE REPORT ---');
    console.log(`Total Transactions  : ${report.processed}`);
    console.log(`Total Time          : ${(report.totalTime / 1000).toFixed(2)}s`);
    console.log(`Avg Latency         : ${report.avgTime.toFixed(2)}ms`);
    console.log(`Ops Per Second      : ${(report.processed / (report.totalTime / 1000)).toFixed(2)}`);
    console.log(`Error Count         : ${report.errors.length}`);

    if (report.errors.length > 0) {
        console.log(`Last Error: ${report.errors[0].message}`);
    }

    if (report.avgTime < 150 && report.errors.length === 0) {
        console.log('\n✅ PERFORMANCE TARGETS MET');
    } else {
        console.log('\n⚠️ PERFORMANCE TARGETS NOT FULLY MET OR ERRORS DETECTED');
    }
}

main()
    .catch(e => {
        console.error('❌ Performance Test FAILED:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
