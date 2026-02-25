import { z } from 'zod';

// Shared
const DecimalConvertible = z.union([z.number(), z.string()]).transform((val) => {
    if (typeof val === 'number') return val;
    return Number(val.replace(',', '.').replace(/\s/g, ''));
});

// ==========================================
// 1) Listings (Satış İlanları)
// ==========================================
export const networkListingCreateSchema = z.object({
    productId: z.string().min(1, "Product ID required"),
    price: DecimalConvertible.refine((val) => val > 0, { message: "Price must be greater than zero" }),
    availableQty: z.number().int().min(0).default(0),
    minQty: z.number().int().min(0).optional(),
    leadTimeDays: z.number().int().min(0).optional()
});

export const networkListingUpdateSchema = z.object({
    price: DecimalConvertible.refine((val) => val > 0, { message: "Price must be greater than zero" }).optional(),
    availableQty: z.number().int().min(0).optional(),
    minQty: z.number().int().min(0).optional(),
    leadTimeDays: z.number().int().min(0).optional(),
    status: z.enum(['ACTIVE', 'PAUSED', 'INACTIVE']).optional()
});

// ==========================================
// 2) Demands (Tedarik Talepleri - RFQ)
// ==========================================
export const networkDemandCreateSchema = z.object({
    type: z.enum(['PRODUCT', 'LOGISTICS', 'SERVICE', 'ACCOUNTING']),
    globalProductId: z.string().optional(),
    payload: z.record(z.string(), z.any()).optional().default({})
}).refine((data) => {
    // If type is PRODUCT, MVP rule: globalProductId must be provided
    if (data.type === 'PRODUCT' && !data.globalProductId) {
        return false;
    }
    return true;
}, {
    message: "globalProductId is required for PRODUCT demands",
    path: ["globalProductId"]
});

export const networkDemandUpdateSchema = z.object({
    status: z.enum(['OPEN', 'CLOSED', 'CANCELLED', 'EXPIRED']),
    payload: z.record(z.string(), z.any()).optional()
});

// ==========================================
// 3) Offers (Taleplere Verilen Teklifler)
// ==========================================
export const networkOfferCreateSchema = z.object({
    price: DecimalConvertible.refine((val) => val > 0, { message: "Offer price must be greater than zero" }),
    payload: z.record(z.string(), z.any()).optional()
});

// ==========================================
// 4) Orders (Cevap/Listeleme için Queries)
// ==========================================
export const networkOrderQuerySchema = z.object({
    status: z.enum(['PENDING_PAYMENT', 'PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'DISPUTED', 'CANCELLED', 'RETURNED']).optional(),
    role: z.enum(['buyer', 'seller']).optional().default('buyer'),
    cursor: z.string().optional(),
    take: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional().default(20)
});
