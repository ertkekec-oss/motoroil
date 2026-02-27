import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as GetOverview } from '../../src/app/api/admin/dashboard/overview/route';
import { POST as PostActions } from '../../src/app/api/admin/dashboard/actions/route';

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
            platformDailyMetrics: {
                findMany: vi.fn().mockResolvedValue([{ gmvGross: 1000, takeRevenueCommission: 50, takeRevenueBoost: 10, payoutVolume: 900 }])
            },
            boostBillingHealthSnapshot: {
                findFirst: vi.fn().mockResolvedValue({ outstandingArTotal: 100, blockedSubscriptionsCount: 1, overdueCount: 5, graceCount: 2 })
            },
            disputeCase: {
                count: vi.fn().mockResolvedValue(10)
            },
            boostRule: {
                count: vi.fn().mockResolvedValue(5)
            },
            financeOpsLog: {
                create: vi.fn()
            }
        }
    };
});

import { getSession } from '@/lib/auth';

describe('Admin: Executive Dashboard', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    describe('GET Overview', () => {
        it('blocks non-admin users', async () => {
            (getSession as any).mockResolvedValue({ role: 'USER' });
            const req = new Request('http://localhost/api/admin/dashboard/overview');
            const res = await GetOverview(req);
            expect(res.status).toBe(403);
        });

        it('allows PLATFORM_ADMIN and returns aggregated metrics without PII', async () => {
            (getSession as any).mockResolvedValue({ role: 'PLATFORM_ADMIN' });
            const req = new Request('http://localhost/api/admin/dashboard/overview?range=today');
            const res = await GetOverview(req);
            expect(res.status).toBe(200);

            const data = await res.json();
            expect(data.finance.gmvGross).toBe(1000);
            expect(data.finance.takeRevenueCommission).toBe(50);
            expect(data.risk.openDisputes).toBe(10);
        });
    });

    describe('POST Actions', () => {
        it('blocks unauthorized roles for RUN_COLLECTION_GUARD', async () => {
            (getSession as any).mockResolvedValue({ role: 'OPS_ADMIN' }); // Ops admin implies no finance rights
            const req = new Request('http://localhost/api/admin/dashboard/actions', {
                method: 'POST',
                headers: { 'x-idempotency-key': 'key-1' },
                body: JSON.stringify({ actionType: 'RUN_COLLECTION_GUARD', reason: 'running monthly tasks' })
            });
            const res = await PostActions(req);
            expect(res.status).toBe(403);
        });

        it('requires reason', async () => {
            (getSession as any).mockResolvedValue({ role: 'PLATFORM_FINANCE_ADMIN' });
            const req = new Request('http://localhost/api/admin/dashboard/actions', {
                method: 'POST',
                headers: { 'x-idempotency-key': 'key-1' },
                body: JSON.stringify({ actionType: 'RUN_RECONCILE_PULL' }) // no reason
            });
            const res = await PostActions(req);
            expect(res.status).toBe(400);

            const data = await res.json();
            expect(data.error).includes('least 10 chars');
        });

        it('executes action if role allows', async () => {
            (getSession as any).mockResolvedValue({ role: 'PLATFORM_FINANCE_ADMIN' });
            const req = new Request('http://localhost/api/admin/dashboard/actions', {
                method: 'POST',
                headers: { 'x-idempotency-key': 'key-valid' },
                body: JSON.stringify({ actionType: 'RUN_RECONCILE_PULL', reason: 'forcing reconcile' })
            });
            const res = await PostActions(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.ok).toBe(true);
        });
    });
});
