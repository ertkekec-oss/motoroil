import { z } from 'zod';
import {
    NetworkDisputeType,
    NetworkDisputePriority,
    NetworkDisputeEvidenceType,
    NetworkDisputeEvidenceVisibility,
    NetworkDisputeStatus,
    NetworkDisputeDecision
} from '@prisma/client';

export const OpenDisputeSchema = z.object({
    orderId: z.string().min(1, "Order ID is required"),
    shipmentId: z.string().optional(),
    escrowHoldId: z.string().optional(),
    againstTenantId: z.string().min(1, "Counterparty tenant ID is required"),
    disputeType: z.nativeEnum(NetworkDisputeType),
    priority: z.nativeEnum(NetworkDisputePriority).default(NetworkDisputePriority.MEDIUM),
    title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title is too long"),
    summary: z.string().min(10, "Summary must be at least 10 characters").max(2000, "Summary is too long"),
    claimedAmount: z.number().min(0).optional(),
    currency: z.string().default('TRY'),
});

export type OpenDisputeInput = z.infer<typeof OpenDisputeSchema>;

export const AddEvidenceSchema = z.object({
    evidenceType: z.nativeEnum(NetworkDisputeEvidenceType),
    fileKey: z.string().optional(),
    fileName: z.string().optional(),
    mimeType: z.string().optional(),
    textContent: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    visibilityScope: z.nativeEnum(NetworkDisputeEvidenceVisibility).default(NetworkDisputeEvidenceVisibility.BOTH_PARTIES),
}).refine(data => {
    return (data.fileKey && data.fileName) || (data.textContent && data.textContent.length > 0);
}, {
    message: "Either a file or text content must be provided for evidence",
    path: ["fileKey"]
});

export type AddEvidenceInput = z.infer<typeof AddEvidenceSchema>;

export const RespondDisputeSchema = z.object({
    action: z.enum(['ADD_MESSAGE', 'PROVIDE_EVIDENCE', 'ACCEPT_CLAIM']),
    message: z.string().optional(),
    evidence: AddEvidenceSchema.optional(),
});

export type RespondDisputeInput = z.infer<typeof RespondDisputeSchema>;

export const ResolveDisputeSchema = z.object({
    decision: z.nativeEnum(NetworkDisputeDecision),
    refundAmount: z.number().min(0).optional(),
    releaseAmount: z.number().min(0).optional(),
    notes: z.string().min(10, "Reasoning must be clearly stated in notes"),
});

export type ResolveDisputeInput = z.infer<typeof ResolveDisputeSchema>;

