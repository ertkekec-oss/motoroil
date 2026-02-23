
import { prisma } from './prisma';

export interface TenantLimits {
    monthly_documents: number;
    companies: number;
    users: number;      // System Users
    employees: number;  // Company Staff
}

export async function getTenantLimits(tenantId: string): Promise<TenantLimits> {
    const subscription = await (prisma as any).subscription.findUnique({
        where: { tenantId },
        include: {
            plan: {
                include: { limits: true }
            }
        }
    });

    const defaultLimits: TenantLimits = {
        monthly_documents: 0,
        companies: 0,
        users: 0,
        employees: 0
    };

    if (!subscription) return defaultLimits;

    const limits = subscription.plan.limits;

    return {
        monthly_documents: limits.find((l: any) => l.resource === 'monthly_documents')?.limit || 0,
        companies: limits.find((l: any) => l.resource === 'companies')?.limit || 0,
        users: limits.find((l: any) => l.resource === 'users')?.limit || 0,
        employees: limits.find((l: any) => l.resource === 'employees')?.limit || 0
    };
}

export async function checkLimit(tenantId: string, resource: keyof TenantLimits, currentUsage?: number): Promise<{
    allowed: boolean;
    used: number;
    limit: number;
    error?: string;
}> {
    const limits = await getTenantLimits(tenantId);
    const limit = limits[resource];

    // -1 or 0 (if intended as unlimited) might mean unlimited, but let's stick to -1 as unlimited
    if (limit === -1) return { allowed: true, used: 0, limit: -1 };

    let used = currentUsage;

    if (used === undefined) {
        if (resource === 'users') {
            used = await prisma.user.count({ where: { tenantId } });
        } else if (resource === 'employees') {
            used = await prisma.staff.count({ where: { tenantId } });
        } else if (resource === 'companies') {
            used = await prisma.company.count({ where: { tenantId } });
        } else {
            used = 0; // Fallback for other resources if not provided
        }
    }

    if (used >= limit && limit > 0) {
        const resourceNames: Record<string, string> = {
            users: 'sistem kullanıcısı',
            employees: 'şirket çalışanı',
            companies: 'firma',
            monthly_documents: 'aylık döküman'
        };
        return {
            allowed: false,
            used,
            limit,
            error: `${resourceNames[resource]} limitine ulaştınız (${limit}). Devam etmek için paketini yükseltin.`
        };
    }

    return { allowed: true, used, limit };
}
