import { EnvelopeStatus, RecipientStatus } from '@prisma/client';

export function canTransitionEnvelope(from: EnvelopeStatus, to: EnvelopeStatus): boolean {
    const validTransitions: Record<EnvelopeStatus, EnvelopeStatus[]> = {
        DRAFT: ['SENT', 'VOIDED'],
        SENT: ['DELIVERED', 'VIEWED', 'SIGNING', 'COMPLETED', 'DECLINED', 'VOIDED'],
        DELIVERED: ['VIEWED', 'SIGNING', 'COMPLETED', 'DECLINED', 'VOIDED'],
        VIEWED: ['SIGNING', 'COMPLETED', 'DECLINED', 'VOIDED'],
        SIGNING: ['COMPLETED', 'DECLINED', 'VOIDED'],
        COMPLETED: [],
        DECLINED: [],
        VOIDED: []
    };
    return validTransitions[from]?.includes(to) || false;
}

export function canTransitionRecipient(from: RecipientStatus, to: RecipientStatus): boolean {
    const validTransitions: Record<RecipientStatus, RecipientStatus[]> = {
        CREATED: ['SENT', 'VIEWED'],
        SENT: ['DELIVERED', 'VIEWED', 'OTP_VERIFIED', 'SIGNING', 'SIGNED', 'DECLINED'],
        DELIVERED: ['VIEWED', 'OTP_VERIFIED', 'SIGNING', 'SIGNED', 'DECLINED'],
        VIEWED: ['OTP_VERIFIED', 'SIGNING', 'SIGNED', 'DECLINED'],
        OTP_VERIFIED: ['SIGNING', 'SIGNED', 'DECLINED'],
        SIGNING: ['SIGNED', 'DECLINED'],
        SIGNED: [],
        DECLINED: []
    };
    return validTransitions[from]?.includes(to) || false;
}

/**
 * Ensures sequential signing by orderIndex.
 * Returns true if the recipient is allowed to sign at this moment.
 */
export function enforceOrderIndex(recipients: { orderIndex: number; status: RecipientStatus; id: string }[], currentRecipientId: string): boolean {
    const recipient = recipients.find(r => r.id === currentRecipientId);
    if (!recipient) return false;

    // Check if there are any pending signers with a LOWER orderIndex
    const pendingBefore = recipients.some(r => r.orderIndex < recipient.orderIndex && r.status !== 'SIGNED' && r.status !== 'DECLINED');

    if (pendingBefore) {
        return false;
    }
    return true;
}
