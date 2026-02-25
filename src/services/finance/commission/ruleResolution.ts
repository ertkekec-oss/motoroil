import { CommissionRuleMatchType, CommissionRuleScope } from '@prisma/client';
import type { Prisma } from '@prisma/client';

export interface CommissionRuleSortable {
    id: string;
    scope: CommissionRuleScope;
    matchType: CommissionRuleMatchType;
    priority: number;
    createdAt: Date;
    categoryId?: string | null;
    brandId?: string | null;
    ratePercentage: Prisma.Decimal;
    fixedFee: Prisma.Decimal;
}

export function resolveRuleForLine(
    categoryId: string | null | undefined,
    brandId: string | null | undefined,
    rules: CommissionRuleSortable[]
): CommissionRuleSortable | null {
    // 1. Filter out rules that don't match the line item
    const matchedRules = rules.filter(r => {
        switch (r.matchType) {
            case CommissionRuleMatchType.CATEGORY_AND_BRAND:
                return r.categoryId === categoryId && r.brandId === brandId;
            case CommissionRuleMatchType.CATEGORY:
                return r.categoryId === categoryId;
            case CommissionRuleMatchType.BRAND:
                return r.brandId === brandId;
            case CommissionRuleMatchType.DEFAULT:
                return true;
            default:
                return false;
        }
    });

    if (matchedRules.length === 0) return null;

    // 2. Sort to find best match deterministically
    return sortRules(matchedRules)[0];
}

export function sortRules(rules: CommissionRuleSortable[]): CommissionRuleSortable[] {
    return [...rules].sort((a, b) => {
        // 1) Scope precedence: COMPANY_OVERRIDE > GLOBAL
        if (a.scope !== b.scope) {
            return a.scope === CommissionRuleScope.COMPANY_OVERRIDE ? -1 : 1;
        }

        // 2) Match specificity calculation
        const getSpecificity = (matchType: CommissionRuleMatchType) => {
            switch (matchType) {
                case CommissionRuleMatchType.CATEGORY_AND_BRAND: return 100;
                case CommissionRuleMatchType.CATEGORY: return 50;
                case CommissionRuleMatchType.BRAND: return 50;
                case CommissionRuleMatchType.DEFAULT: return 0;
                default: return 0;
            }
        };
        const specA = getSpecificity(a.matchType);
        const specB = getSpecificity(b.matchType);
        if (specA !== specB) return specB - specA;

        // 3) Priority DESC
        if (a.priority !== b.priority) return b.priority - a.priority;

        // 4) createdAt DESC (newer wins)
        if (a.createdAt.getTime() !== b.createdAt.getTime()) return b.createdAt.getTime() - a.createdAt.getTime();

        // 5) id DESC (tie breaker determinism)
        return b.id.localeCompare(a.id);
    });
}
