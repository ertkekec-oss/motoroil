import { Prisma } from '@prisma/client';

export function calculateLineCommission(
    unitPrice: Prisma.Decimal,
    quantity: number,
    ratePercentage: Prisma.Decimal,
    fixedFee: Prisma.Decimal,
    precision: number = 2,
    roundingMode: 'HALF_UP' | 'UP' | 'DOWN' = 'HALF_UP'
): Prisma.Decimal {
    const baseAmount = Number(unitPrice) * quantity;
    const rate = Number(ratePercentage) / 100;

    let percentageFee = baseAmount * rate;

    // Apply rounding
    percentageFee = roundToPrecision(percentageFee, precision, roundingMode);

    // Add fixed fee (converting Decimal to number, round together)
    const fixed = Number(fixedFee);
    const lineCommissionTotal = percentageFee + fixed;

    return new Prisma.Decimal(roundToPrecision(lineCommissionTotal, precision, roundingMode));
}

function roundToPrecision(num: number, precision: number, mode: 'HALF_UP' | 'UP' | 'DOWN'): number {
    const factor = Math.pow(10, precision);

    if (mode === 'HALF_UP') {
        return Math.round(num * factor) / factor;
    } else if (mode === 'UP') {
        return Math.ceil(num * factor) / factor;
    } else if (mode === 'DOWN') {
        return Math.floor(num * factor) / factor;
    }

    return num;
}
