import { prisma } from '@/lib/prisma';

export interface PayrollEngineParams {
    periodYear: number;
    sgkFloor: number;
    sgkCeiling: number;
    stampTaxRate: number;
    incomeTaxBrackets: Array<{ limit: number | null, rate: number }>;
}

export async function getPayrollParams(periodYear: number): Promise<PayrollEngineParams> {
    const params = await prisma.payrollParameter.findUnique({
        where: { periodYear }
    });

    if (params) {
        return {
            periodYear: params.periodYear,
            sgkFloor: Number(params.sgkFloor),
            sgkCeiling: Number(params.sgkCeiling),
            stampTaxRate: Number(params.stampTaxRate),
            incomeTaxBrackets: params.incomeTaxBrackets as any
        };
    }

    // 2024 varsayılan fallback değerleri
    return {
        periodYear,
        sgkFloor: 20002.50,
        sgkCeiling: 150018.90,
        stampTaxRate: 0.00759,
        incomeTaxBrackets: [
            { limit: 110000, rate: 0.15 },
            { limit: 230000, rate: 0.20 },
            { limit: 870000, rate: 0.27 },
            { limit: 3000000, rate: 0.35 },
            { limit: null, rate: 0.40 } // Süreklilik için null koyulur
        ]
    };
}

export function calculateGrossToNet(
    gross: number,
    params: PayrollEngineParams,
    workedDays: number = 30, // Kıstelyevm (Ay 30 üzerinden sayılır genel olarak TR'de)
    cumulativeBase: number = 0
) {
    // Kıstelyevm uygulanmış Brüt
    const grossProrated = gross === 0 ? 0 : (gross / 30) * workedDays;

    if (grossProrated <= 0) {
        return {
            gross: 0,
            sgkDeduction: 0,
            unemploymentDeduction: 0,
            incomeTax: 0,
            stampTax: 0,
            net: 0
        };
    }

    // 1. SGK Matrahı (Tavan/Taban kontrolü)
    let sgkBase = grossProrated;
    if (sgkBase < params.sgkFloor) sgkBase = params.sgkFloor; // 2024 istisnai durumlarında güncellenebilir, şimdilik minimum taban alınır
    if (sgkBase > params.sgkCeiling) sgkBase = params.sgkCeiling;

    const sgkDeduction = sgkBase * 0.14; // %14 İşçi SGK Payı
    const unemploymentDeduction = sgkBase * 0.01; // %1 İşçi İşsizlik

    // 2. Gelir Vergisi Matrahı (Vergi matrahına tavan taban girmez, normal brüt baz alınır)
    const taxBase = grossProrated - sgkDeduction - unemploymentDeduction;

    // 3. Gelir Vergisi Hesaplama (Dilimli)
    let currentBase = cumulativeBase;
    let remainingTaxBase = taxBase;
    let incomeTax = 0;

    for (const bracket of params.incomeTaxBrackets) {
        if (remainingTaxBase <= 0) break;
        const bracketLimit = bracket.limit || Infinity;

        if (currentBase < bracketLimit) {
            const availableInBracket = bracketLimit - currentBase;
            const taxableInThisBracket = Math.min(remainingTaxBase, availableInBracket);
            incomeTax += taxableInThisBracket * bracket.rate;
            remainingTaxBase -= taxableInThisBracket;
            currentBase += taxableInThisBracket;
        }
    }

    // Asgari Ücret İstisnası (Türkiye'de herkesin asgari ücret kadarki kısmı vergiden muaf)
    const minWageSgk = params.sgkFloor * 0.14;
    const minWageUnemp = params.sgkFloor * 0.01;
    const minWageTaxBase = params.sgkFloor - minWageSgk - minWageUnemp;
    const minWageIncomeTax = minWageTaxBase * 0.15; // Pratik hesap, tüm yıla özel matrahı eklenebilir ama şu an basitleştirildi.

    let finalIncomeTax = incomeTax - minWageIncomeTax;
    if (finalIncomeTax < 0) finalIncomeTax = 0;

    // 4. Damga Vergisi ve İstisnası
    let stampTax = grossProrated * params.stampTaxRate;
    const minWageStampTax = params.sgkFloor * params.stampTaxRate;
    let finalStampTax = stampTax - minWageStampTax;
    if (finalStampTax < 0) finalStampTax = 0;

    // 5. Net Maaş
    const net = grossProrated - sgkDeduction - unemploymentDeduction - finalIncomeTax - finalStampTax;

    return {
        gross: grossProrated,
        sgkDeduction,
        unemploymentDeduction,
        incomeTax: finalIncomeTax,
        stampTax: finalStampTax,
        net
    };
}

export function calculateNetToGross(
    targetNet: number,
    params: PayrollEngineParams,
    workedDays: number = 30,
    cumulativeBase: number = 0
) {
    if (targetNet <= 0) {
        return calculateGrossToNet(0, params, workedDays, cumulativeBase);
    }

    // Binary search (Tersine Mühendislik) method to find Gross from Net
    let low = targetNet;
    let high = targetNet * 3; // Brüt genelde netin maksimum 2-3 katı olur vergi dilimlerinden
    let bestGross = targetNet;

    for (let i = 0; i < 60; i++) { // 60 iterasyon tolerans için fazlasıyla yeterli
        let mid = (low + high) / 2;
        let result = calculateGrossToNet(mid, params, workedDays, cumulativeBase);
        
        if (Math.abs(result.net - targetNet) < 0.01) {
            bestGross = mid;
            break;
        } else if (result.net < targetNet) {
            low = mid;
        } else {
            high = mid;
        }
        bestGross = mid;
    }

    return calculateGrossToNet(bestGross, params, workedDays, cumulativeBase);
}
