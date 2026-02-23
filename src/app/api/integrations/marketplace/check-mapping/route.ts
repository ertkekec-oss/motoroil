import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize } from '@/lib/auth';

// ── Fuzzy similarity (Dice coefficient on bigrams) ──────────────────────────
// Returns 0..1 — no external library needed
function bigrams(str: string): Set<string> {
    const s = str.toLowerCase().replace(/[^a-z0-9ğüşİıöçÇÖÜŞĞ]/gi, ' ').replace(/\s+/g, ' ').trim();
    const bg = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) bg.add(s.slice(i, i + 2));
    return bg;
}

function diceScore(a: string, b: string): number {
    if (!a || !b) return 0;
    const bgA = bigrams(a);
    const bgB = bigrams(b);
    if (bgA.size === 0 && bgB.size === 0) return 1;
    if (bgA.size === 0 || bgB.size === 0) return 0;
    let inter = 0;
    bgA.forEach(g => { if (bgB.has(g)) inter++; });
    return (2 * inter) / (bgA.size + bgB.size);
}

// Simple token containment boost: does every word in A appear in B?
function tokenContainment(a: string, b: string): number {
    const ta = a.toLowerCase().split(/\s+/).filter(Boolean);
    const tb = b.toLowerCase();
    const hits = ta.filter(t => tb.includes(t)).length;
    return ta.length ? hits / ta.length : 0;
}

// Combined score (0..100 integer)
function computeScore(marketplaceName: string, inventoryName: string): number {
    const dice = diceScore(marketplaceName, inventoryName);
    const token = tokenContainment(marketplaceName, inventoryName);
    return Math.round((dice * 0.6 + token * 0.4) * 100);
}

// Scoring thresholds
const SCORE_AUTO = 80; // ≥ 80 → auto-match (green)
const SCORE_SUGGEST = 40; // 40-79 → suggest, user confirms (yellow)
//                       // < 40  → no match, offer new product card

export async function POST(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    try {
        const body = await request.json();
        const { marketplace, items } = body; // items: [{ code, name }]

        if (!marketplace || !items || !Array.isArray(items)) {
            return NextResponse.json({ success: false, error: 'Eksik veri' }, { status: 400 });
        }

        const company = await prisma.company.findFirst({
            where: { tenantId: auth.user.tenantId },
            select: { id: true }
        });
        if (!company) return NextResponse.json({ success: false, error: 'Firma bulunamadı' }, { status: 404 });

        const companyId = company.id;

        // ── Step 1: Exact DB mappings ────────────────────────────────────────
        const codes = items.map((i: any) => i.code).filter(Boolean);
        const existingMaps = await prisma.marketplaceProductMap.findMany({
            where: { companyId, marketplace, marketplaceCode: { in: codes } },
            include: { product: { select: { id: true, name: true, code: true, stock: true } } }
        });

        // ── Step 2: Fuzzy candidates — fetch all inventory products ──────────
        const allProducts = await prisma.product.findMany({
            where: { companyId },
            select: { id: true, name: true, code: true, barcode: true, stock: true }
        });

        // ── Step 3: Build result for each item ──────────────────────────────
        const result: Record<string, any> = {};

        for (const item of items) {
            if (!item.code) continue;

            // Check exact DB mapping first
            const exactMap = existingMaps.find(m => m.marketplaceCode === item.code);
            if (exactMap) {
                result[item.code] = {
                    status: 'mapped',       // exact → auto-confirm
                    score: 100,
                    internalProduct: exactMap.product,
                    marketplaceName: item.name
                };
                continue;
            }

            // ── Barcode / code exact match ───────────────────────────────────
            const barcodeMatch = allProducts.find(
                p => p.barcode === item.code || p.code === item.code
            );
            if (barcodeMatch) {
                result[item.code] = {
                    status: 'mapped',
                    score: 100,
                    internalProduct: barcodeMatch,
                    marketplaceName: item.name
                };
                continue;
            }

            // ── Fuzzy scoring against all inventory products ─────────────────
            let bestScore = 0;
            let bestProduct: any = null;
            const suggestions: any[] = [];

            for (const prod of allProducts) {
                const score = computeScore(item.name, prod.name);
                if (score > bestScore) {
                    bestScore = score;
                    bestProduct = prod;
                }
                if (score >= SCORE_SUGGEST) {
                    suggestions.push({ score, product: prod });
                }
            }

            // Sort suggestions descending
            suggestions.sort((a, b) => b.score - a.score);
            const top5 = suggestions.slice(0, 5);

            if (bestScore >= SCORE_AUTO) {
                // High confidence → auto-map
                result[item.code] = {
                    status: 'mapped',
                    score: bestScore,
                    internalProduct: bestProduct,
                    suggestions: top5,
                    marketplaceName: item.name
                };
            } else if (bestScore >= SCORE_SUGGEST) {
                // Medium confidence → show suggestion, ask user
                result[item.code] = {
                    status: 'suggest',
                    score: bestScore,
                    internalProduct: bestProduct,  // top suggestion
                    suggestions: top5,
                    marketplaceName: item.name
                };
            } else {
                // Low confidence → no match found, offer new product card
                result[item.code] = {
                    status: 'notFound',
                    score: bestScore,
                    internalProduct: null,
                    suggestions: top5,          // maybe a few low-score hints
                    marketplaceName: item.name
                };
            }
        }

        return NextResponse.json({ success: true, mappings: result });

    } catch (error: any) {
        console.error('Mapping Check Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
