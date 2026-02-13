type LogContext = {
    companyId?: string;
    marketplace?: string;
    shipmentPackageId?: string;
    idempotencyKey?: string;
    auditId?: string;
    jobId?: string;
    requestId?: string;
    actionKey?: string;
    status?: string;
    durationMs?: number;
    size?: number;
    retryCount?: number;
    error?: string;
    errorMessage?: string;
    tenantId?: string;
    alertType?: 'QUEUE_BACKLOG' | 'EXTERNAL_FAILURE_RATE' | 'STUCK_JOB' | 'CANARY_FAILURE';
};

export const logger = {
    info: (message: string, context: LogContext = {}) => {
        console.log(JSON.stringify({
            level: 'INFO',
            timestamp: new Date().toISOString(),
            message,
            ...context
        }));
    },
    error: (message: string, error: any, context: LogContext = {}) => {
        console.error(JSON.stringify({
            level: 'ERROR',
            timestamp: new Date().toISOString(),
            message,
            error: error?.message || error,
            stack: error?.stack,
            ...context
        }));
    },
    warn: (message: string, context: LogContext = {}) => {
        console.warn(JSON.stringify({
            level: 'WARN',
            timestamp: new Date().toISOString(),
            message,
            ...context
        }));
    },
    alert: (message: string, context: LogContext) => {
        console.error(JSON.stringify({
            level: 'ALERT',
            timestamp: new Date().toISOString(),
            message,
            isAlert: true,
            ...context
        }));
        // Proactive: Send to Slack/PagerDuty here in real prod
    }
};

export const metrics = {
    idempotencyHit: (marketplace: string, actionKey: string) => {
        logger.info('METRIC: idempotency_hit', { marketplace, actionKey });
    },
    externalCall: (marketplace: string, actionKey: string, status: 'SUCCESS' | 'FAILED') => {
        logger.info('METRIC: external_call', { marketplace, actionKey, status });
    },
    queueLatency: (actionKey: string, durationMs: number) => {
        logger.info('METRIC: queue_latency', { actionKey, durationMs });
    },
    labelStored: (marketplace: string, size: number) => {
        logger.info('METRIC: label_stored', { marketplace, size });
    }
};
