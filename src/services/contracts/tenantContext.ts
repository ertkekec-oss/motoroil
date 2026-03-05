import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

/**
 * Ensures the tenant boundary for any given server action or route.
 * Always resolves to a valid tenant string or throws an error.
 */
export async function getStrictTenantId(): Promise<string> {
    const session: any = await getSession();
    if (!session?.user?.tenantId) {
        throw new Error("UNAUTHORIZED: Tenant id is missing");
    }
    return session.user.tenantId;
}

/**
 * Used for database migrations or triggers that simulate RLS at PostgreSQL level
 * In Periodya, logic is currently handled in application layer (Prisma extension),
 * but this is placed for standard usage in contract transactions.
 */
export async function setTenantContext(tx: any, tenantId: string) {
    // If PostgreSQL RLS is enabled on cluster level:
    // await tx.$executeRawUnsafe(`SELECT set_config('app.tenant_id', $1, true)`, tenantId);

    // For now it acts as a no-op guard. Prisma extension handles row-level isolation.
    if (!tenantId) throw new Error("Tenant ID is required for operations.");
}
