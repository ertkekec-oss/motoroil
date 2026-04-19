import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface B2BDebtEdge {
  fromTenant: string; // Debtor
  toTenant: string;   // Creditor
  amount: number;
}

export class B2BClearingEngine {
  /**
   * Represents the core Graph Algorithm for Periodya Trade Network.
   * Finds closed debt cycles (e.g., A owes B, B owes C, C owes A)
   * to propose zero-cash clearing (Mahsuplaşma).
   */
  public static async detectDebtCycles(edges: B2BDebtEdge[]): Promise<B2BDebtEdge[][]> {
    logger.info('Starting B2B Network Cycle Detection...', { edgeCount: edges.length });
    
    const adjacencyList = new Map<string, Array<{ to: string; amount: number }>>();
    
    for (const edge of edges) {
      if (!adjacencyList.has(edge.fromTenant)) {
        adjacencyList.set(edge.fromTenant, []);
      }
      adjacencyList.get(edge.fromTenant)!.push({ to: edge.toTenant, amount: edge.amount });
    }

    const cycles: B2BDebtEdge[][] = [];
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const path: B2BDebtEdge[] = [];

    // Simple DFS for detecting cycles in directed graph
    const dfs = (currentNode: string, startNode: string) => {
      visited.add(currentNode);
      recStack.add(currentNode);

      const neighbors = adjacencyList.get(currentNode) || [];
      for (const neighbor of neighbors) {
        path.push({ fromTenant: currentNode, toTenant: neighbor.to, amount: neighbor.amount });
        
        if (!visited.has(neighbor.to)) {
          dfs(neighbor.to, startNode);
        } else if (recStack.has(neighbor.to)) {
          // Cycle detected
          const cycleIndex = path.findIndex(e => e.fromTenant === neighbor.to);
          if (cycleIndex !== -1) {
            cycles.push([...path.slice(cycleIndex)]);
          }
        }
        path.pop();
      }
      recStack.delete(currentNode);
    };

    // Run DFS from each node to find multiple cycles
    for (const node of Array.from(adjacencyList.keys())) {
      visited.clear();
      dfs(node, node);
    }

    // Deduplicate cycles based on nodes involved (simplified approach)
    const uniqueCycles = new Map<string, B2BDebtEdge[]>();
    for (const cycle of cycles) {
      const hash = cycle.map(e => e.fromTenant).sort().join('-');
      if (!uniqueCycles.has(hash)) {
        uniqueCycles.set(hash, cycle);
      }
    }

    return Array.from(uniqueCycles.values());
  }

  /**
   * Persist a discovered cycle to the Prisma database for cross-tenant approval.
   */
  public static async proposeClearing(cycle: B2BDebtEdge[], primaryTenantId: string) {
    if (cycle.length < 2) return null;

    // Find the minimum debt in the cycle (this is the max amount that can be cleared without cash)
    const clearingAmount = Math.min(...cycle.map(e => e.amount));
    const cycleHash = cycle.map(e => e.fromTenant).sort().join('-');
    const participants = cycle.map(e => e.fromTenant);

    try {
      // Create the Autonomous Clearing Graph Proposal
      // @ts-ignore - Prisma types will catch up after generation
      const proposal = await prisma.b2BClearingGraph.create({
        data: {
          tenantId: primaryTenantId,
          cycleHash,
          participants: JSON.stringify(participants),
          clearingAmount: clearingAmount,
          status: 'PROPOSED',
        }
      });
      
      logger.info('Proposed new B2B Clearing Cycle!', { clearingAmount, participants });
      return proposal;
    } catch (error) {
      logger.error('Failed to propose clearing cycle.', { error });
      throw error;
    }
  }
}
