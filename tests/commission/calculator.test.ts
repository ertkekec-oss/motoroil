import { describe, it } from 'node:test';
import { equal } from 'node:assert';
import { Prisma } from '@prisma/client';
import { calculateLineCommission } from '../../src/services/finance/commission/calculator';

describe('Calculator', () => {

    it('calculates exact precision HALF_UP for basic amounts', () => {
        const result = calculateLineCommission(
            new Prisma.Decimal(99.50),
            10,
            new Prisma.Decimal(5.25),
            new Prisma.Decimal(0),
            2,
            'HALF_UP'
        );
        equal(Number(result), 52.24);
    });

    it('adds fixed fee properly respecting precision', () => {
        const result = calculateLineCommission(
            new Prisma.Decimal(10.00),
            1,
            new Prisma.Decimal(10.0),
            new Prisma.Decimal(1.111),
            2,
            'HALF_UP'
        );
        equal(Number(result), 2.11);
    });

    it('handles zero quantity or zero rate safely', () => {
        const noQty = calculateLineCommission(new Prisma.Decimal(100), 0, new Prisma.Decimal(5), new Prisma.Decimal(0));
        equal(Number(noQty), 0);

        const noRate = calculateLineCommission(new Prisma.Decimal(100), 5, new Prisma.Decimal(0), new Prisma.Decimal(5.50));
        equal(Number(noRate), 5.50);
    });
});
