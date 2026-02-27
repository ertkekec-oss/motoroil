import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as GetDisputeDetail } from '../../src/app/api/admin/disputes/[ticketId]/route';
import { POST as PostDisputeAction } from '../../src/app/api/admin/disputes/[ticketId]/actions/route';
import { POST as PostRequestInfo } from '../../src/app/api/admin/disputes/[ticketId]/request-info/route';

// Mock Auth
vi.mock('@/lib/auth', () => ({
    getSession: vi.fn()
}));

// Mock Idempotency
vi.mock('@/lib/idempotency', () => ({
    withIdempotency: vi.fn(async (key, tenantId, fn) => await fn())
}));

vi.mock('@/lib/prisma', () => {
    return {
        default: {
            $transaction: vi.fn(async (cb) => {
                return await cb({
                    disputeAction: { create: vi.fn().mockResolvedValue({ id: 'action-1' }) },
                    disputeCase: { update: vi.fn().mockResolvedValue({ id: 'case-1', status: 'RESOLVED', escrowActionState: 'REFUNDED' }) },
                    financeAuditLog: { create: vi.fn() },
                    ticketMessage: { create: vi.fn() },
                    ticket: { update: vi.fn() }
                });
            }),
            ticket: {
                findUnique: vi.fn().mockResolvedValue({
                    id: 'tkt-1',
                    type: 'SHIPPING_DISPUTE',
                    tenantId: 'buyer-1',
                    counterpartyTenantId: 'seller-1',
                    messages: [
                        { id: 'msg-1', senderRole: 'USER', createdAt: new Date(), message: 'My phone is +123', redactedMessage: 'My phone is ***' }
                    ]
                })
            },
            disputeCase: {
                findUnique: vi.fn().mockResolvedValue({
                    id: 'case-1',
                    ticketId: 'tkt-1',
                    status: 'OPEN',
                    escrowActionState: 'HELD',
                    actions: []
                }),
                create: vi.fn(),
                update: vi.fn().mockResolvedValue({ id: 'case-1', status: 'NEEDS_INFO' })
            }
        }
    };
});

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

describe('Admin: Dispute & Arbitration Center', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('RBAC & Detail Access', () => {
        it('blocks non-admin users from viewing detail', async () => {
            (getSession as any).mockResolvedValue({ role: 'USER', tenantId: 'buyer-1' });
            const req = new Request('http://localhost/api/admin/disputes/tkt-1');
            const res = await GetDisputeDetail(req, { params: Promise.resolve({ ticketId: 'tkt-1' }) });

            expect(res.status).toBe(401);
        });

        it('allows PLATFORM_RISK_ADMIN to view detail and drops PII', async () => {
            (getSession as any).mockResolvedValue({ role: 'PLATFORM_RISK_ADMIN' });
            const req = new Request('http://localhost/api/admin/disputes/tkt-1');
            const res = await GetDisputeDetail(req, { params: Promise.resolve({ ticketId: 'tkt-1' }) });

            expect(res.status).toBe(200);
            const data = await res.json();

            // PII checking
            expect(data.messages[0].redactedMessage).toBe('My phone is ***');
            expect(data.messages[0].message).toBeUndefined(); // We never return raw message
        });
    });

    describe('Monetary Actions', () => {
        it('blocks PLATFORM_RISK_ADMIN from taking monetary actions (REFUND)', async () => {
            (getSession as any).mockResolvedValue({ role: 'PLATFORM_RISK_ADMIN' });
            const req = new Request('http://localhost/api/admin/disputes/tkt-1/actions', {
                method: 'POST',
                headers: { 'x-idempotency-key': 'key-1' },
                body: JSON.stringify({ actionType: 'REFUND', reason: 'Refund approved' })
            });
            const res = await PostDisputeAction(req, { params: Promise.resolve({ ticketId: 'tkt-1' }) });

            expect(res.status).toBe(403);
            const data = await res.json();
            expect(data.error).toContain('Unauthorized role');
        });

        it('allows PLATFORM_FINANCE_ADMIN to perform REFUND', async () => {
            (getSession as any).mockResolvedValue({ role: 'PLATFORM_FINANCE_ADMIN' });
            const req = new Request('http://localhost/api/admin/disputes/tkt-1/actions', {
                method: 'POST',
                headers: { 'x-idempotency-key': 'abc' },
                body: JSON.stringify({ actionType: 'REFUND', reason: 'Finance override refund' })
            });
            const res = await PostDisputeAction(req, { params: Promise.resolve({ ticketId: 'tkt-1' }) });

            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.success).toBe(true);
            expect(data.result.nextState).toBe('REFUNDED');
            expect(data.result.nextStatus).toBe('RESOLVED');

            // Assert tx was created
            expect(prisma.$transaction).toHaveBeenCalled();
        });

        it('prevents FULL_RELEASE if state is already RELEASED or REFUNDED', async () => {
            (getSession as any).mockResolvedValue({ role: 'PLATFORM_FINANCE_ADMIN' });

            (prisma.disputeCase.findUnique as any).mockResolvedValueOnce({
                id: 'case-x', escrowActionState: 'REFUNDED', status: 'RESOLVED', actions: []
            });

            const req = new Request('http://localhost/api/admin/disputes/tkt-1/actions', {
                method: 'POST',
                headers: { 'x-idempotency-key': 'kkk' },
                body: JSON.stringify({ actionType: 'FULL_RELEASE', reason: 'I changed my mind' })
            });
            const res = await PostDisputeAction(req, { params: Promise.resolve({ ticketId: 'tkt-1' }) });

            expect(res.status).toBe(500); // Throws Error
            const data = await res.json();
            expect(data.error).toContain('Already fully processed');
        });
    });

    describe('Information Requests', () => {
        it('creates a SYSTEM message and updates ticket state', async () => {
            (getSession as any).mockResolvedValue({ role: 'PLATFORM_RISK_ADMIN' });
            const req = new Request('http://localhost/api/admin/disputes/tkt-1/request-info', {
                method: 'POST',
                headers: { 'x-idempotency-key': 'req-info-1' },
                body: JSON.stringify({ fieldsRequested: ['Proof of Delivery'] })
            });
            const res = await PostRequestInfo(req, { params: Promise.resolve({ ticketId: 'tkt-1' }) });

            expect(res.status).toBe(200);
            expect(prisma.$transaction).toHaveBeenCalled();
        });
    });
});
