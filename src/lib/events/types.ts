export type EventType =
    | 'SIGNATURE_INVITATION_SENT'
    | 'SIGNATURE_COMPLETED'
    | 'SIGNATURE_REJECTED'
    | 'RECONCILIATION_SENT'
    | 'RECONCILIATION_VIEWED'
    | 'RECONCILIATION_DISPUTED'
    | 'DISPUTE_RESOLVED'
    | 'OTP_SENT'
    | 'OTP_FAILED'
    | 'MAIL_SENT'
    | 'MAIL_FAILED'
    | 'TASK_CREATED';

export interface AppEvent {
    type: EventType;
    tenantId?: string;
    companyId?: string;
    userId?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    title?: string;
    message?: string;
    meta?: Record<string, any>;
}
