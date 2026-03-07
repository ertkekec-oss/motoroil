export interface SystemJobDefinition {
    jobType: string;
    moduleScope: string;
    defaultQueue: string;
    defaultPriority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
    maxRetries: number;
    backoff: 'FIXED' | 'LINEAR' | 'EXPONENTIAL';
    supportsScheduling: boolean;
    idempotencyRequired: boolean;
    handler: (job: any) => Promise<any>;
}
