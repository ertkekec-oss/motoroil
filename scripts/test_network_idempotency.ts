import { withIdempotentProcessing } from '../src/services/network/hardening/processing/retryPolicy';
import prisma from '../src/lib/prisma';

async function testIdempotency() {
    console.log("=== IDEMPOTENCY HARDENING TEST ===");
    const testId = `test-ent-${Date.now()}`;

    let processCount = 0;

    const mockJob = async () => {
        processCount++;
        return { success: true, count: processCount };
    };

    const config = {
        processorType: 'TEST_JOB',
        entityType: 'TestEntity',
        entityId: testId,
        input: { data: 'test1234' }
    };

    console.log("First Run...");
    const res1 = await withIdempotentProcessing(config, mockJob);
    console.log(`Skipped: ${res1.skipped}, Result:`, res1.result);

    console.log("Second Run (Exact same parameters)...");
    const res2 = await withIdempotentProcessing(config, mockJob);
    console.log(`Skipped: ${res2.skipped}, Result:`, res2.result);

    if (!res2.skipped) throw new Error("Idempotency failed, job ran twice!");
    if (processCount !== 1) throw new Error("Job business logic executed twice!");

    // Check DB
    const cp = await prisma.networkProcessingCheckpoint.findUnique({ where: { idempotencyKey: res1.idempotencyKey! } });
    console.log(`DB Checkpoint Status: ${cp?.processingStatus}`);
    if (cp?.processingStatus !== 'PROCESSED') throw new Error("Failed to persist checkpoint state.");

    console.log("SUCCESS");
    process.exit(0);
}

testIdempotency().catch(console.error);
