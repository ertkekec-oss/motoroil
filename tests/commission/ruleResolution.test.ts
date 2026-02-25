import { describe, it } from 'node:test';
import { equal } from 'node:assert';
import { Prisma } from '@prisma/client';
import { CommissionRuleMatchType, CommissionRuleScope } from '@prisma/client';
import { resolveRuleForLine, CommissionRuleSortable } from '../src/services/finance/commission/ruleResolution';

const baseDate = new Date('2026-02-26T00:00:00.000Z');

const rules: CommissionRuleSortable[] = [
    {
        id: 'rule-global-default',
        scope: CommissionRuleScope.GLOBAL,
        matchType: CommissionRuleMatchType.DEFAULT,
        priority: 0,
        createdAt: baseDate,
        categoryId: null,
        brandId: null,
        ratePercentage: new Prisma.Decimal(5.0),
        fixedFee: new Prisma.Decimal(0)
    },
    {
        id: 'rule-global-cat',
        scope: CommissionRuleScope.GLOBAL,
        matchType: CommissionRuleMatchType.CATEGORY,
        priority: 0,
        createdAt: baseDate,
        categoryId: 'CAT_A',
        brandId: null,
        ratePercentage: new Prisma.Decimal(7.0),
        fixedFee: new Prisma.Decimal(0)
    },
    {
        id: 'rule-global-brand',
        scope: CommissionRuleScope.GLOBAL,
        matchType: CommissionRuleMatchType.BRAND,
        priority: 5,
        createdAt: baseDate,
        categoryId: null,
        brandId: 'BRAND_X',
        ratePercentage: new Prisma.Decimal(6.0),
        fixedFee: new Prisma.Decimal(0)
    },
    {
        id: 'rule-override-cat-brand',
        scope: CommissionRuleScope.COMPANY_OVERRIDE,
        matchType: CommissionRuleMatchType.CATEGORY_AND_BRAND,
        priority: 0,
        createdAt: baseDate,
        categoryId: 'CAT_A',
        brandId: 'BRAND_X',
        ratePercentage: new Prisma.Decimal(10.0),
        fixedFee: new Prisma.Decimal(2)
    }
];

describe('Commission Rule Resolution', () => {
    it('should resolve DEFAULT rule if nothing else matches', () => {
        const selected = resolveRuleForLine('UNKNOWN_CAT', 'UNKNOWN_BRAND', rules);
        equal(selected?.id, 'rule-global-default');
    });

    it('should resolve CATEGORY match based on specificity', () => {
        const selected = resolveRuleForLine('CAT_A', 'UNKNOWN_BRAND', rules);
        equal(selected?.id, 'rule-global-cat');
    });

    it('should prefer override CATEGORY_AND_BRAND over priority or default when exact match', () => {
        const selected = resolveRuleForLine('CAT_A', 'BRAND_X', rules);
        equal(selected?.id, 'rule-override-cat-brand');
        equal(Number(selected?.ratePercentage), 10.0);
    });

    it('should resolve by tie-break rules deterministic ID if identical specificities', () => {
        const tieRules: CommissionRuleSortable[] = [
            { id: '1', scope: CommissionRuleScope.GLOBAL, matchType: CommissionRuleMatchType.DEFAULT, priority: 0, createdAt: baseDate, ratePercentage: new Prisma.Decimal(1), fixedFee: new Prisma.Decimal(0) },
            { id: '2', scope: CommissionRuleScope.GLOBAL, matchType: CommissionRuleMatchType.DEFAULT, priority: 0, createdAt: baseDate, ratePercentage: new Prisma.Decimal(2), fixedFee: new Prisma.Decimal(0) },
        ];

        const selected = resolveRuleForLine('ANY', 'ANY', tieRules);
        equal(selected?.id, '2');
    });
});
