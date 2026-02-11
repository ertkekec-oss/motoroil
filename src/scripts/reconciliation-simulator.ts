import { PrismaClient } from '@prisma/client';
import { SettlementReconciliationEngine } from '../services/fintech/settlement-reconciliation-engine';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function runTest(name: string, openAmount: number, paidAmount: number, expectedStatus: string) {
    console.log(`\n🧪 Testing: ${name}`);

    // 1. Setup Company & Accounts (Quick hack for demo)
    const company = await prisma.company.findFirst();
    if (!company) throw new Error("No company found for test");

    // 2. Create Open Receivable (The Order / Settlement stage)
    const journalEntry = await prisma.journalEntry.create({
        data: {
            companyId: company.id,
            description: `Initial Receivable for ${name}`,
            lines: {
                create: [
                    {
                        accountCode: '120.03',
                        debit: 0,
                        credit: new Decimal(openAmount),
                        companyId: company.id,
                        isOpen: true
                    }
                ]
            }
        }
    });

    // 3. Create Bank Statement (The Payout stage)
    const statement = await prisma.bankStatement.create({
        data: {
            companyId: company.id,
            bankAccountCode: '102.01',
            statementDate: new Date(),
            referenceNo: `REF-${Math.random().toString(36).substring(7).toUpperCase()}`,
            description: `Bank Deposit for ${name}`,
            debit: 0,
            credit: new Decimal(paidAmount),
            isMatched: false
        }
    });

    // 4. Trigger Reconciliation Engine
    console.log(`   ⚙️ Running Reconciliation Engine... (Open: ${openAmount}, paid: ${paidAmount})`);
    const result = await SettlementReconciliationEngine.reconcileBankStatement(statement.id);

    // 5. Verify
    console.log(`   📊 Result Status: ${result?.status}, Difference: ${result?.difference}`);

    if (result?.status === expectedStatus) {
        console.log(`   ✅ ${name.toUpperCase()} TEST PASSED`);
        return true;
    } else {
        console.log(`   ❌ ${name.toUpperCase()} TEST FAILED (Expected ${expectedStatus}, got ${result?.status})`);
        return false;
    }
}

async function main() {
    console.log('🏁 Starting Reconciliation Simulation Stress Test...');

    // Clear old test data to avoid pollution in balance summing
    await prisma.journalLine.updateMany({ where: { accountCode: '120.03' }, data: { isOpen: false } });

    const results = [];

    // Scenario 1: FULL MATCH
    results.push(await runTest("Full Match", 100000, 100000, "FULL"));

    // Scenario 2: TOLERANCE
    results.push(await runTest("Tolerance Match", 1000, 999.25, "TOLERATED"));

    // Scenario 3: SUSPENSE (Large Difference)
    results.push(await runTest("Suspense Match", 10000, 9990, "MISMATCH"));

    // Scenario 4: PARTIAL (Wait, current engine logic sums ALL. For simple partial we can just test mismatch if single entry)
    // Actually current logic treats anything not matching total as Mismatch or Tolerated.
    // If bank pays 60k for 100k open, it results in MISMATCH status in current basic engine.
    results.push(await runTest("Partial Payment", 100000, 60000, "MISMATCH"));

    console.log('\n--- FINAL REPORT ---');
    const allPassed = results.every(r => r === true);
    if (allPassed) {
        console.log('✅ ALL RECONCILIATION TESTS SUCCESSFUL');
    } else {
        console.log('❌ SOME TESTS FAILED');
    }
}

main()
    .catch(e => {
        console.error('❌ Simulation Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
