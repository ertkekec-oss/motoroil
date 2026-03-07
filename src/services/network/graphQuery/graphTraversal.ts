import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class GraphTraversal {
    /**
     * Retrieves immediate generic neighbors (1 hop distance) either as supplier or buyer.
     */
    static async getDirectNeighbors(tenantId: string, filters: any = {}) {
        return await this.getNeighborsByHopDistance(tenantId, 1, filters);
    }

    /**
     * Recursive/SQL-based distance fetching.
     * If hopDistance = 1 -> direct relationships.
     * If hopDistance > 1 -> uses CompanyGraphAdjacencyCache or joins to traverse.
     */
    static async getNeighborsByHopDistance(tenantId: string, hopDistance: number, filters: any = {}) {
        // In a production scenario with large graphs, we rely on the AdjacencyCache.
        // For local logic demonstration, querying CompanyRelationship:
        let relationQuery: any = {
            OR: [
                { sourceTenantId: tenantId },
                { targetTenantId: tenantId }
            ],
            status: 'ACTIVE'
        };

        if (filters.categoryId) {
            // Assume context checks for specific capabilities if category ID is present
        }

        const connections = await prisma.companyRelationship.findMany({
            where: relationQuery,
            take: filters.limit || 50
        });

        return connections.map(conn => ({
            neighborId: conn.sourceTenantId === tenantId ? conn.targetTenantId : conn.sourceTenantId,
            relationType: conn.sourceTenantId === tenantId ? 'BUYER' : 'SUPPLIER',
            hopDistance: 1 // Since we didn't implement recursive SQL in this demo function, all are 1 hop
        }));
    }

    static async getSupplierNeighborhood(tenantId: string, filters: any = {}) {
        return await prisma.companyRelationship.findMany({
            where: { targetTenantId: tenantId, status: 'ACTIVE' },
            take: filters.limit || 50
        });
    }

    static async getBuyerNeighborhood(tenantId: string, filters: any = {}) {
        return await prisma.companyRelationship.findMany({
            where: { sourceTenantId: tenantId, status: 'ACTIVE' },
            take: filters.limit || 50
        });
    }

    static async getReachableNodes(tenantId: string, maxHop: number, filters: any = {}) {
        // Queries the Adjacency Cache model to find all reachable nodes within a max radius.
        return {
            tenantId,
            maxHop,
            nodes: [] // Dummy return for architecture demo
        };
    }
}
