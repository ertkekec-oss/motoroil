import { PrismaClient } from '@prisma/client';
import { BankSyncEngine } from '../src/services/banking/bank-sync-engine';
import { GOLDEN_MOCK_DATASET } from '../src/services/banking/mock-dataset';

const prisma = new PrismaClient();

async function main() {
    console.log('--- STARTING GOLDEN RUN SIMULATION ---');

    // 1. Find or create a test tenant and company
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
        console.log('No tenant found. Creating dummy test tenant...');
        tenant = await prisma.tenant.create({
            data: {
                name: 'Test Tenant',
                ownerEmail: 'test@periodya.com',
                status: 'ACTIVE'
            }
        });
    }

    let company = await prisma.company.findFirst();
    if (!company) {
        console.log('No company found. Creating dummy test company...');
        company = await prisma.company.create({
            data: {
                tenantId: tenant.id,
                name: 'Fintech Test Corp',
                vkn: '1234567890',
                address: 'Test Cad. No:1'
            } as any
        });
    }

    // 2. Add Matching Rules for the company
    await (prisma as any).matchingRule.deleteMany({ where: { companyId: company.id } });
    await (prisma as any).matchingRule.createMany({
        data: [
            { companyId: company.id, pattern: 'TRENDYOL', targetType: 'MARKETPLACE', accountCode: '120.03', confidence: 100 },
            { companyId: company.id, pattern: 'KIRA', targetType: 'EXPENSE', accountCode: '770.01', confidence: 100 },
        ]
    });
    console.log('Matching rules initialized.');

    // 3. Prepare Connection
    const bankId = 'MOCK_TEST';
    const iban = 'TR00-TEST-PIPELINE-001';

    let testConn = await (prisma as any).bankConnection.findFirst({
        where: { companyId: company.id, bankId }
    });

    if (!testConn) {
        testConn = await (prisma as any).bankConnection.create({
            data: {
                companyId: company.id,
                bankName: 'Pipeline Test Bank',
                bankId,
                iban,
                integrationMethod: 'PULL_HTTP',
                status: 'ACTIVE',
                connectionType: 'AUTO_PULL'
            }
        });
    }

    // 4. Clean up before test
    await (prisma as any).bankTransaction.deleteMany({
        where: { bankConnectionId: testConn.id }
    });
    console.log('Database cleaned for test connection.');

    // 5. Run First Pass
    process.env.BANK_LIVE_MODE = 'DRY_RUN';
    console.log('Running First Pass (DRY_RUN)...');

    const rawData = GOLDEN_MOCK_DATASET.map((tx, idx) => ({
        // If no bankRef, use a deterministic index-based ID to test fingerprint collision
        id: tx.bankRef || `MOCK_TX_${idx}`,
        amount: Number(tx.amount) * (tx.direction === 'OUT' ? -1 : 1),
        currency: tx.currency,
        description: tx.description || '',
        date: tx.bookingDate,
        reference: tx.bankRef
    }));

    const firstPassResults = await BankSyncEngine.processTransactions(testConn, rawData, 'DRY_RUN');

    // 6. Run Second Pass (Duplicate Check)
    console.log('Running Second Pass (DRY_RUN)...');
    const secondPassResults = await BankSyncEngine.processTransactions(testConn, rawData, 'DRY_RUN');

    // 7. Gather Stats
    const transactions = await (prisma as any).bankTransaction.findMany({
        where: { bankConnectionId: testConn.id },
        include: { matches: true }
    });

    console.log('\n--- RESULTS ---');
    console.log(`Mock Items: ${GOLDEN_MOCK_DATASET.length}`);
    console.log(`First Pass Inserted: ${firstPassResults}`);
    console.log(`Second Pass Inserted: ${secondPassResults}`);
    console.log(`Total In DB: ${transactions.length}`);

    // Confidence Distribution
    const matches = await (prisma as any).paymentMatch.findMany({
        where: { bankTransactionId: { in: transactions.map((t: any) => t.id) } }
    });

    const high = matches.filter((m: any) => m.confidenceBucket === 'HIGH').length;
    const medium = matches.filter((m: any) => m.confidenceBucket === 'MEDIUM').length;
    const low = matches.filter((m: any) => m.confidenceBucket === 'LOW').length;

    console.log(`Confidence Distribution: HIGH=${high}, MEDIUM=${medium}, LOW=${low}`);

    // Detail Log for normalization check
    if (transactions.length > 0) {
        const sample = transactions.find((t: any) => t.description.includes('TRENDYOL'));
        console.log(`Normalization Sample: "${sample?.description}"`);
    }

    // Final Isolation Check
    const bankJournals = await prisma.journalEntry.findMany({
        where: { sourceEventId: { in: transactions.map((t: any) => t.id) } }
    });
    console.log(`Ledger Isolation Check (Journals created): ${bankJournals.length}`);

    // EXPECTED: 7 unique items (1&2 duplicate, 8&9 duplicate)
    if (firstPassResults === 7 && secondPassResults === 0 && bankJournals.length === 0 && high > 0) {
        console.log('✅ PASS: Idempotency, Isolation & Matching verified.');
    } else {
        console.log('❌ FAIL: Validation failed.');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
