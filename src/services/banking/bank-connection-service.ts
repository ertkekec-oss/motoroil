import prisma from '@/lib/prisma';

export type BankConnectionStatus = 'DRAFT' | 'PENDING_ACTIVATION' | 'ACTIVE' | 'ERROR' | 'EXPIRED';

export type BankErrorCode =
    | 'IP_NOT_WHITELISTED'
    | 'AUTH_FAILED'
    | 'NO_PERMISSION'
    | 'FORMAT_MISMATCH'
    | 'RATE_LIMIT'
    | 'BANK_DOWN'
    | 'TIMEOUT'
    | 'UNKNOWN';

const VALID_TRANSITIONS: Record<BankConnectionStatus, BankConnectionStatus[]> = {
    'DRAFT': ['PENDING_ACTIVATION', 'ERROR'],
    'PENDING_ACTIVATION': ['ACTIVE', 'ERROR', 'DRAFT'],
    'ACTIVE': ['ERROR', 'EXPIRED', 'PENDING_ACTIVATION'],
    'ERROR': ['ACTIVE', 'EXPIRED', 'PENDING_ACTIVATION'],
    'EXPIRED': ['ACTIVE', 'ERROR', 'PENDING_ACTIVATION']
};

export class BankConnectionService {
    /**
     * Updates the status of a bank connection following state machine rules.
     */
    static async updateStatus(
        connectionId: string,
        newStatus: BankConnectionStatus,
        context: {
            actorId: string,
            reasonCode?: string,
            errorMessage?: string,
            errorCode?: BankErrorCode
        }
    ) {
        const connection = await (prisma as any).bankConnection.findUnique({
            where: { id: connectionId }
        });

        if (!connection) throw new Error('Connection not found');

        const currentStatus = connection.status as BankConnectionStatus;

        // Verify transition validity
        if (!VALID_TRANSITIONS[currentStatus]?.includes(newStatus) && currentStatus !== newStatus) {
            throw new Error(`Illegal state transition: ${currentStatus} -> ${newStatus}`);
        }

        const updateData: any = {
            status: newStatus,
            updatedAt: new Date()
        };

        if (context.errorCode) {
            updateData.lastErrorCode = context.errorCode;
            updateData.lastErrorAt = new Date();

            if (newStatus === 'ERROR' || newStatus === 'EXPIRED') {
                updateData.consecutiveFailures = { increment: 1 };
                // Exponential backoff calculation for nextRetryAt
                const delay = Math.min(60, Math.pow(2, (connection.consecutiveFailures || 0)) * 5); // 5m, 10m, 20m, 40m, 60m...
                updateData.nextRetryAt = new Date(Date.now() + delay * 60000);
            } else if (newStatus === 'ACTIVE') {
                updateData.consecutiveFailures = 0;
                updateData.nextRetryAt = null;
            }
        }

        if (context.errorMessage) {
            updateData.lastErrorMessage = context.errorMessage;
        }

        const updated = await (prisma as any).bankConnection.update({
            where: { id: connectionId },
            data: updateData
        });

        // Audit Log
        await (prisma as any).fintechAudit.create({
            data: {
                companyId: connection.companyId,
                who: context.actorId,
                action: 'BANK_CONNECTION_STATUS_CHANGED',
                before: { status: currentStatus },
                after: { status: newStatus, errorCode: context.errorCode },
                details: JSON.stringify({
                    reasonCode: context.reasonCode,
                    errorMessage: context.errorMessage,
                    connectionId
                })
            }
        });

        return updated;
    }

    /**
     * Classifies error types based on typical bank response patterns
     */
    static classifyError(error: any): BankErrorCode {
        const msg = (error.message || String(error)).toUpperCase();

        if (msg.includes('WHITELIST') || msg.includes('IP ACCESS')) return 'IP_NOT_WHITELISTED';
        if (msg.includes('AUTH') || msg.includes('PASSWORD') || msg.includes('CREDENTIAL')) return 'AUTH_FAILED';
        if (msg.includes('PERMISSION') || msg.includes('NOT AUTHORIZED') || msg.includes('FORBIDDEN')) return 'NO_PERMISSION';
        if (msg.includes('FORMAT') || msg.includes('PARSING') || msg.includes('DESERIALIZATION')) return 'FORMAT_MISMATCH';
        if (msg.includes('RATE LIMIT') || msg.includes('TOO MANY REQUESTS')) return 'RATE_LIMIT';
        if (msg.includes('DOWN') || msg.includes('MAINTENANCE') || msg.includes('503')) return 'BANK_DOWN';
        if (msg.includes('TIMEOUT') || msg.includes('ETIMEDOUT') || msg.includes('ABORTED')) return 'TIMEOUT';

        return 'UNKNOWN';
    }
}
