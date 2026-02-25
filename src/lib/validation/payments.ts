import { z } from 'zod';

export const paymentInitCreateSchema = z.object({
    mode: z.enum(['DIRECT', 'ESCROW']).optional().default('DIRECT')
});

export const iyzicoWebhookSchema = z.object({
    iyziEventType: z.string(),
    iyziEventTime: z.number().optional(),
    iyziReferenceCode: z.string().optional(),
    paymentId: z.string().optional(),
    status: z.string(),
    price: z.union([z.number(), z.string()]).optional(),
    currency: z.string().optional()
}).passthrough();

export const odelWebhookSchema = z.object({
    eventId: z.string(),
    paymentId: z.string().optional(),
    status: z.string(),
    amount: z.union([z.number(), z.string()]).optional(),
    currency: z.string().optional()
}).passthrough();
