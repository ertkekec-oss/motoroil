import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { BankConnectionService } from '@/services/banking/bank-connection-service';
import { BANK_FORM_DEFINITIONS } from '@/services/banking/bank-definitions';

// Mock function to simulate validation logic from credentials route
const validateCredentials = (bankId: string, credentials: any) => {
    const bankDef = BANK_FORM_DEFINITIONS[bankId];
    if (!bankDef) return { success: false, error: 'Bank not found' };

    // Dynamic Validation Logic
    const missing = bankDef.requiredCredentials.filter(key => !credentials[key] || credentials[key].trim() === '');
    if (missing.length > 0) return { success: false, missing };
    return { success: true };
};

export async function GET(request: Request) {
    // Only allow in development or via specific secret (simplified for this context)
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Test route only available in dev' }, { status: 403 });
    }

    const results: any[] = [];
    let passed = 0;
    let failed = 0;

    const log = (testName: string, success: boolean, details?: any) => {
        if (success) passed++; else failed++;
        results.push({ testName, status: success ? 'PASS' : 'FAIL', details });
    };

    try {
        // TEST 1: Kuveyt Turk Permission Logic (Customer No Only)
        // Description: Kuveyt Turk only requires customerNo. Password/Username are optional.
        const ktValidation = validateCredentials('KUVEYT_TURK', { customerNo: '123456' });
        log(
            'Kuveyt Türk Credential Policy',
            ktValidation.success === true,
            ktValidation.success ? 'Validation Passed with only customerNo' : `Failed: Missing ${ktValidation.missing}`
        );

        // TEST 2: Akbank Permission Logic (Strict)
        // Description: Akbank requires serviceUsername and servicePassword.
        const akValidation = validateCredentials('AKBANK', { customerNo: '123456' });
        log(
            'Akbank Strict Credential Policy',
            akValidation.success === false,
            akValidation.success ? 'Apps incorrectly accepted missing password' : 'Correctly rejected missing credentials'
        );

        // TEST 3: State Machine - Illegal Transition
        // Description: DRAFT -> ACTIVE without intermediate steps or checks (Simulated via Service)
        // We need a real DB record for this.
        const company = await prisma.company.findFirst();
        if (company) {
            const testConn = await prisma.bankConnection.create({
                data: {
                    companyId: company.id,
                    bankName: 'TEST_BANK',
                    iban: 'TR_TEST_' + Date.now(),
                    status: 'DRAFT',
                    connectionType: 'TEST',
                    bankId: 'AKBANK'
                }
            });

            try {
                // Try illegal transition DRAFT -> ACTIVE
                await BankConnectionService.updateStatus(testConn.id, 'ACTIVE', { actorId: 'TEST_RUNNER' });
                log('State Machine Enforcement (DRAFT -> ACTIVE)', false, 'Services allowed illegal transition');
            } catch (e: any) {
                log('State Machine Enforcement (DRAFT -> ACTIVE)', true, `Correctly blocked: ${e.message}`);
            }

            // TEST 4: State Machine - Valid Transition
            try {
                // DRAFT -> PENDING_ACTIVATION
                await BankConnectionService.updateStatus(testConn.id, 'PENDING_ACTIVATION', { actorId: 'TEST_RUNNER' });
                // PENDING_ACTIVATION -> ACTIVE
                await BankConnectionService.updateStatus(testConn.id, 'ACTIVE', { actorId: 'TEST_RUNNER' });
                log('State Machine Valid Flow', true, 'DRAFT -> PENDING -> ACTIVE transition successful');
            } catch (e: any) {
                log('State Machine Valid Flow', false, `Failed valid transition: ${e.message}`);
            }

            // TEST 5: Error Classification & Retry Logic
            // Simulate an error update
            await BankConnectionService.updateStatus(testConn.id, 'ERROR', {
                actorId: 'TEST_RUNNER',
                errorCode: 'TIMEOUT',
                errorMessage: 'Connection timed out'
            });

            const updatedConn = await prisma.bankConnection.findUnique({ where: { id: testConn.id } });
            log(
                'Error Context & Retry Calculation',
                updatedConn?.status === 'ERROR' && updatedConn?.lastErrorCode === 'TIMEOUT' && !!updatedConn?.nextRetryAt,
                `Next Retry: ${updatedConn?.nextRetryAt}`
            );

            // Cleanup
            await prisma.bankConnection.delete({ where: { id: testConn.id } });
        } else {
            log('Database Integration Tests', false, 'No company found to run DB tests');
        }

    } catch (error: any) {
        log('Global Test Runner', false, error.message);
    }

    return NextResponse.json({
        summary: { total: passed + failed, passed, failed },
        results
    });
}
