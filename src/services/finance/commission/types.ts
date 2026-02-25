import { PrismaClient, Prisma } from '@prisma/client';

// Assumption: The order item includes category/brand concepts indirectly or directly.
// Adapting this interface to what we need for rule resolution:
export interface OrderItemInput {
    id: string;
    unitPrice: Prisma.Decimal;
    quantity: number;
    categoryId?: string | null;
    brandId?: string | null;
}

export interface OrderInput {
    id: string;
    tenantId: string;       // Buyer tenant ID (or marketplace platform ID)
    sellerCompanyId: string; // The seller who will pay commission
    items: OrderItemInput[];
}
