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
    oldData?: any; // Compat
    newData?: any; // Compat
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
                before: params.before ? JSON.parse(JSON.stringify(params.before)) : (params.oldData ? JSON.parse(JSON.stringify(params.oldData)) : undefined),
                after: params.after ? JSON.parse(JSON.stringify(params.after)) : (params.newData ? JSON.parse(JSON.stringify(params.newData)) : undefined),
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
