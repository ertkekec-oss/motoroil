import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as PostPolicies, GET as GetPolicies } from '../../src/app/api/admin/payments-escrow/policies/route';
import { POST as PostCommissionPreview } from '../../src/app/api/admin/payments-escrow/commissions/preview/route';

// Mock DB and Auth
vi.mock('@/lib/prisma', () => ({
    default: {
        $transaction: vi.fn((cb) => cb({
            appSettings: { upsert: vi.fn() },
            financeAuditLog: { create: vi.fn() },
            commissionPlan: { create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), findUnique: vi.fn() },
            commissionRule: { create: vi.fn(), deleteMany: vi.fn() }
        })),
        appSettings: { findMany: vi.fn().mockResolvedValue([]) },
        commissionPlan: {
            findFirst: vi.fn().mockResolvedValue({
                id: 'plan-1',
                name: 'Test Plan',
                companyId: null,
                currency: 'TRY',
                rules: [
                    { id: 'rule-1', matchType: 'CATEGORY', category: 'cat-1', ratePercentage: 5, fixedFee: 0, priority: 10, scope: 'GLOBAL' },
                    { id: 'rule-2', matchType: 'DEFAULT', ratePercentage: 2, fixedFee: 1, priority: 0, scope: 'GLOBAL' }
                ]
            })
        }
    }
}));

vi.mock('@/services/finance/commission/ruleResolution', () => ({
    resolveCommissionRule: vi.fn((rules, context) => {
        if (context.category === 'cat-1') return rules.find((r: any) => r.matchType === 'CATEGORY');
        return rules.find((r: any) => r.matchType === 'DEFAULT');
    }),
    calculateCommission: vi.fn((rule, gross, plan) => ({
        rateAmount: (gross * rule.ratePercentage) / 100,
        fixedFee: rule.fixedFee,
        total: ((gross * rule.ratePercentage) / 100) + rule.fixedFee,
        tax: 0
    }))
}));

vi.mock('@/lib/auth', () => ({
    getSession: vi.fn()
}));

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

describe('Admin: Payments & Escrow Governance', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Policies (Kill Switches & Defaults)', () => {
        it('blocks non-admin users', async () => {
            (getSession as any).mockResolvedValue({ role: 'USER', tenantId: 'tenant-1' });

            const req = new Request('http://localhost', { method: 'GET' });
            const res = await GetPolicies();

            expect(res.status).toBe(401);
        });

        it('allows PLATFORM_ADMIN and returns defaults', async () => {
            (getSession as any).mockResolvedValue({ role: 'ADMIN', tenantId: 'PLATFORM_ADMIN' });

            const res = await GetPolicies();
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.globalEscrowDefaults.defaultHoldDays).toBe(14);
            expect(data.escrowPaused).toBe(false);
        });

        it('requires reason for policy updates', async () => {
            (getSession as any).mockResolvedValue({ role: 'SUPER_ADMIN', tenantId: 'any' });

            const req = new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ escrowPaused: true }) // Missing reason
            });
            const res = await PostPolicies(req);

            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toContain('reason is required');
        });
    });

    describe('Commission Preview (Dry-run)', () => {
        it('returns deterministic rule selection (Category match over Default)', async () => {
            (getSession as any).mockResolvedValue({ role: 'SUPER_ADMIN' });

            const req = new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ categoryId: 'cat-1', grossAmount: 1000 })
            });

            const res = await PostCommissionPreview(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.rule.matchType).toBe('CATEGORY');
            expect(data.rule.ratePercentage).toBe(5);
            expect(data.commissionDetails.total).toBe(50); // 5% of 1000
            expect(data.effectiveTakeRate).toBe(5);
        });

        it('falls back to default rule if no category match', async () => {
            (getSession as any).mockResolvedValue({ role: 'SUPER_ADMIN' });

            const req = new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ categoryId: 'cat-unknown', grossAmount: 1000 })
            });

            const res = await PostCommissionPreview(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.rule.matchType).toBe('DEFAULT');
            expect(data.rule.ratePercentage).toBe(2);
            expect(data.commissionDetails.total).toBe(21); // 2% of 1000 + 1 fixed fee
        });
    });
});
