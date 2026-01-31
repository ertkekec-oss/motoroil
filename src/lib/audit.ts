import prisma from './prisma';

interface LogParams {
    userId?: string;
    userName?: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT';
    entity: string;
    entityId?: string;
    oldData?: any;
    newData?: any;
    details?: string;
    ipAddress?: string;
    branch?: string;
}

export async function logActivity(params: LogParams) {
    try {
        await prisma.auditLog.create({
            data: {
                userId: params.userId,
                userName: params.userName,
                action: params.action,
                entity: params.entity,
                entityId: params.entityId,
                oldData: params.oldData ? JSON.parse(JSON.stringify(params.oldData)) : undefined,
                newData: params.newData ? JSON.parse(JSON.stringify(params.newData)) : undefined,
                details: params.details,
                ipAddress: params.ipAddress,
                branch: params.branch,
            }
        });
    } catch (error) {
        console.error('Audit Log Error:', error);
        // We don't throw error to avoid breaking the main operation if logging fails
    }
}
