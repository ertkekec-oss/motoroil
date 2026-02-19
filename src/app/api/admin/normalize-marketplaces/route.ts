import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const KEY_TO_DISPLAY: Record<string, string> = {
    trendyol: "Trendyol",
    hepsiburada: "Hepsiburada",
    n11: "N11",
    pazarama: "Pazarama",
    amazon: "Amazon",
    pos: "POS",
    POS: "POS",
};

const VARIANT_TO_DISPLAY: Record<string, string> = {
    Trendyol: "Trendyol",
    TRENDYOL: "Trendyol",
    trendyol: "Trendyol",
    Hepsiburada: "Hepsiburada",
    HEPSIBURADA: "Hepsiburada",
    hepsiburada: "Hepsiburada",
    N11: "N11",
    n11: "N11",
    Pazarama: "Pazarama",
    PAZARAMA: "Pazarama",
    pazarama: "Pazarama",
    Amazon: "Amazon",
    AMAZON: "Amazon",
    amazon: "Amazon",
    POS: "POS",
    pos: "POS",
};

function toCanonicalDisplay(mp: string | null): string | null {
    if (mp == null) return null;
    const raw = String(mp).trim();
    if (!raw) return null;

    const direct = VARIANT_TO_DISPLAY[raw as keyof typeof VARIANT_TO_DISPLAY];
    if (direct) return direct;

    const key = raw.toLowerCase();
    const fromKey = KEY_TO_DISPLAY[key as keyof typeof KEY_TO_DISPLAY];
    if (fromKey) return fromKey;

    if (raw.toUpperCase() === "POS") return "POS";

    return raw;
}

export async function GET() {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const before = await prisma.order.groupBy({
            by: ["marketplace"],
            _count: { _all: true },
        });

        let updatedTotal = 0;
        const details = [];

        for (const g of before) {
            const current = g.marketplace;
            if (!current) continue;

            const canonical = toCanonicalDisplay(current);

            if (!canonical || canonical === current) continue;

            const res = await prisma.order.updateMany({
                where: { marketplace: current },
                data: { marketplace: canonical },
            });

            updatedTotal += res.count;
            details.push({ from: current, to: canonical, count: res.count });
        }

        return NextResponse.json({
            success: true,
            message: `Normalization complete. Total updated: ${updatedTotal}`,
            before,
            details
        });

    } catch (error: any) {
        console.error('Normalization API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
