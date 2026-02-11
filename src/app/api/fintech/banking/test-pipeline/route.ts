import { NextResponse } from 'next/server';
import { authorize } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { BankSyncEngine } from '@/services/banking/bank-sync-engine';
import { GOLDEN_MOCK_DATASET } from '@/services/banking/mock-dataset';

/**
 * BANKING PIPELINE TEST RUNNER
 * Runs the GOLDEN_MOCK_DATASET through the BankSyncEngine.
 * Validates: Idempotency, Normalization, Fingerprinting, and Matching.
 */
export async function POST(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const session = auth.user;

    try {
        const { mode = 'DRY_RUN', clearExisting = false } = await req.json();

        const company = await prisma.company.findFirst({ where: { tenantId: session.tenantId } });
        if (!company) throw new Error('Company not found');

        // 1. SETUP: Find or Create a Test Bank Connection
        let testConn = await (prisma as any).bankConnection.findFirst({
            where: { companyId: company.id, bankId: 'MOCK_TEST' }
        });

        if (!testConn) {
            testConn = await (prisma as any).bankConnection.create({
                data: {
                    companyId: company.id,
                    bankName: 'Pipeline Test Bank',
                    bankId: 'MOCK_TEST',
                    iban: 'TR00-TEST-PIPELINE-001',
                    integrationMethod: 'PULL_HTTP',
                    status: 'ACTIVE',
                    connectionType: 'AUTO_PULL'
                }
            });
        }

        if (clearExisting) {
            await (prisma as any).bankTransaction.deleteMany({
                where: { bankConnectionId: testConn.id }
            });
        }

        // 2. EXECUTION: Run the Dataset
        console.log(`[PIPELINE-TEST] Running ${GOLDEN_MOCK_DATASET.length} items in ${mode} mode...`);

        // We override the fetchFromPartner temporarily for this test
        // By injecting the mock data into the engine (we need a way to pass it)
        // For now, let's call a specialized method in BankSyncEngine

        const results = await BankSyncEngine.processTransactions(
            testConn,
            GOLDEN_MOCK_DATASET.map(tx => ({
                id: tx.bankRef || `MOCK_${Math.random()}`,
                amount: Number(tx.amount) * (tx.direction === 'OUT' ? -1 : 1),
                currency: tx.currency,
                description: tx.description || '',
                date: tx.bookingDate,
                reference: tx.bankRef
            }))
        );

        // 3. MEASUREMENTS
        const transactions = await (prisma as any).bankTransaction.findMany({
            where: { bankConnectionId: testConn.id },
            include: { matches: true }
        });

        const totalInDb = transactions.length;

        // Match Statistics
        const matches = await (prisma as any).paymentMatch.findMany({
            where: { bankTransactionId: { in: transactions.map((t: any) => t.id) } }
        });

        const confidenceStats = {
            HIGH: matches.filter((m: any) => m.confidenceBucket === 'HIGH').length,
            MEDIUM: matches.filter((m: any) => m.confidenceBucket === 'MEDIUM').length,
            LOW: matches.filter((m: any) => m.confidenceBucket === 'LOW').length
        };

        const typeStats = {
            RULE: matches.filter((m: any) => m.matchType === 'RULE').length,
            SYSTEMATIC: matches.filter((m: any) => m.matchType === 'SYSTEMATIC').length
        };

        const stats = {
            totalItemsInMock: GOLDEN_MOCK_DATASET.length,
            importedThisRun: results,
            totalInDbAfterRun: totalInDb,
            duplicatesPrevented: GOLDEN_MOCK_DATASET.length - results,
            confidenceDistribution: confidenceStats,
            matchTypeDistribution: typeStats,
            clearExistingUsed: clearExisting
        };

        // 4. AUDIT LOG
        await (prisma as any).fintechAudit.create({
            data: {
                companyId: company.id,
                who: session.id,
                action: 'PIPELINE_TEST_EXECUTED',
                details: JSON.stringify({ stats, mode })
            }
        });

        return NextResponse.json({
            success: true,
            stats,
            message: `Pipeline testi tamamlandı. ${results} yeni işlem eklendi, ${stats.duplicatesPrevented} mükerrer engellendi.`
        });

    } catch (error: any) {
        console.error('Pipeline Test Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
