import prisma from './prisma';

interface LogParams {
    tenantId?: string;
    userId?: string;
    userName?: string;
    action: string;
    entity: string;
    entityId?: string;
    before?: any;
    after?: any;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
    branch?: string;
}

export async function logActivity(params: LogParams) {
    try {
        await (prisma as any).auditLog.create({
            data: {
                tenantId: params.tenantId,
                userId: params.userId,
                userName: params.userName,
                action: params.action,
                entity: params.entity,
                entityId: params.entityId,
                before: params.before ? JSON.parse(JSON.stringify(params.before)) : undefined,
                after: params.after ? JSON.parse(JSON.stringify(params.after)) : undefined,
                details: params.details,
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
                branch: params.branch,
            }
        });
    } catch (error) {
        console.error('Audit Log Error:', error);
        // We don't throw error to avoid breaking the main operation if logging fails
    }
}
