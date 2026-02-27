import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as GetBoostRules, POST as PostBoostRules } from '../../src/app/api/admin/growth/boost-rules/route';
import { POST as PostRunGuard } from '../../src/app/api/admin/growth/billing-health/run-collection-guard/route';

// Mock Auth
vi.mock('@/lib/auth', () => ({ getSession: vi.fn() }));

// Mock Idempotency
vi.mock('@/lib/idempotency', () => ({
    withIdempotency: vi.fn(async (key, tenantId, fn) => await fn())
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => {
    return {
        default: {
            $transaction: vi.fn(async (cb) => {
                return await cb({
                    boostRule: { create: vi.fn().mockResolvedValue({ id: 'rule-new', targetType: 'GLOBAL', multiplier: 2.0 }) },
                    financeOpsLog: { create: vi.fn() },
                    boostInvoice: { update: vi.fn() },
                    boostSubscription: { update: vi.fn() }
                });
            }),
            boostPolicyConfig: {
                findUnique: vi.fn().mockResolvedValue({ maxRuleDurationDays: 90, multiplierMin: 1.0, multiplierMax: 3.0 })
            },
            boostRule: {
                findMany: vi.fn().mockResolvedValue([]),
                create: vi.fn()
            },
            boostInvoice: {
                findMany: vi.fn().mockResolvedValue([
                    { id: 'inv-1', dueDate: new Date(Date.now() - 20 * 24 * 3600 * 1000), collectionStatus: 'OVERDUE', subscription: { id: 'sub-1', billingBlocked: false } }
                ]),
                update: vi.fn()
            },
            boostSubscription: { update: vi.fn() },
            financeOpsLog: { create: vi.fn() }
        }
    };
});

import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

describe('Admin: Growth & Monetization', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    describe('RBAC Guards', () => {
        it('blocks non-admin from reading rules', async () => {
            (getSession as any).mockResolvedValue({ role: 'USER' });
            const req = new Request('http://localhost/api/admin/growth/boost-rules');
            const res = await GetBoostRules(req);
            expect(res.status).toBe(403);
        });

        it('allows PLATFORM_GROWTH_ADMIN to read rules', async () => {
            (getSession as any).mockResolvedValue({ role: 'PLATFORM_GROWTH_ADMIN' });
            const req = new Request('http://localhost/api/admin/growth/boost-rules');
            const res = await GetBoostRules(req);
            expect(res.status).toBe(200);
        });
    });

    describe('Boost Rules', () => {
        it('returns 409 if rule overlaps', async () => {
            (getSession as any).mockResolvedValue({ role: 'PLATFORM_GROWTH_ADMIN' });

            (prisma.boostRule.findMany as any).mockResolvedValueOnce([{ id: 'existing-rule' }]);

            const req = new Request('http://localhost/api/admin/growth/boost-rules', {
                method: 'POST',
                headers: { 'x-idempotency-key': 'abc' },
                body: JSON.stringify({ targetType: 'SELLER', targetId: 'ten-1', multiplier: 2.0, startsAt: new Date(), endsAt: new Date(Date.now() + 100000), reason: 'I need overlap' })
            });
            const res = await PostBoostRules(req);
            expect(res.status).toBe(409);
        });
    });

    describe('Collection Guard Trigger', () => {
        it('executes guard and blocks > 15 days overdue', async () => {
            (getSession as any).mockResolvedValue({ role: 'PLATFORM_FINANCE_ADMIN' });

            const req = new Request('http://localhost/api/admin/growth/billing-health/run-collection-guard', {
                method: 'POST',
                headers: { 'x-idempotency-key': 'abc-123' },
                body: JSON.stringify({ reason: 'Weekly run' })
            });
            const res = await PostRunGuard(req);
            const data = await res.json();
            if (res.status !== 200) console.error(data);
            expect(res.status).toBe(200);

            // The mocked invoice is 20 days old, so it should block
            expect(data.result.countBlocked).toBe(1);
        });
    });
});
