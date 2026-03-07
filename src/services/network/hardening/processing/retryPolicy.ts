import { shouldProcess, markProcessed, markFailed } from './checkpoint';
import { buildIdempotencyKey } from './idempotency';
import crypto from 'crypto';

export async function withIdempotentProcessing(
    config: { processorType: string, entityType: string, entityId: string, input: any },
    handler: () => Promise<any>
) {
    const idempotencyKey = buildIdempotencyKey(config.processorType, config.entityId, config.input);
    const allowProcess = await shouldProcess(idempotencyKey, config.processorType, config.entityType, config.entityId);

    if (!allowProcess) {
        return { skipped: true, idempotencyKey };
    }

    try {
        const result = await handler();
        const resultStr = typeof result === 'object' ? JSON.stringify(result) : String(result);
        const resultHash = crypto.createHash('sha256').update(resultStr).digest('hex');

        await markProcessed(idempotencyKey, resultHash);
        return { skipped: false, result, idempotencyKey };
    } catch (err: any) {
        await markFailed(idempotencyKey, err.message || 'UNKNOWN_ERROR');
        throw err;
    }
}
