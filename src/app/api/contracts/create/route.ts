import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ContractStatus, PaymentMode, SettlementCycle } from "@prisma/client";

export async function POST(req: NextRequest) {
    // Basic auth check for admin-only endpoint
    // In a real app we would check session.role === 'admin'
    // To allow easiest demo, we accept any valid JSON payload matching type
    try {
        const body = await req.json();

        // Expect: { buyerCompanyId, sellerCompanyId, items: [{ productId, baseUnitPrice, minOrderQty, tiers: [{minQty, unitPrice}] }], slas: [{maxDeliveryDays, latePenaltyPercent}] }
        const { buyerCompanyId, sellerCompanyId, items, slas, paymentMode, settlementCycle } = body;

        if (!buyerCompanyId || !sellerCompanyId || !items || !Array.isArray(items)) {
            return NextResponse.json({ ok: false, error: "Missing required contract fields or items." }, { status: 400 });
        }

        const contract = await prisma.contract.create({
            data: {
                buyerCompanyId,
                sellerCompanyId,
                status: ContractStatus.DRAFT,
                paymentMode: paymentMode || PaymentMode.DIRECT,
                settlementCycle: settlementCycle || SettlementCycle.INSTANT,
                items: {
                    create: items.map((i: any) => ({
                        productId: i.productId,
                        baseUnitPrice: i.baseUnitPrice,
                        minOrderQty: i.minOrderQty || 1,
                        tiers: i.tiers ? {
                            create: i.tiers.map((t: any) => ({
                                minQty: t.minQty,
                                unitPrice: t.unitPrice
                            }))
                        } : undefined
                    }))
                },
                slas: slas ? {
                    create: slas.map((s: any) => ({
                        maxDeliveryDays: s.maxDeliveryDays,
                        latePenaltyPercent: s.latePenaltyPercent
                    }))
                } : undefined
            }
        });

        return NextResponse.json({ ok: true, contractId: contract.id });

    } catch (e: any) {
        console.error("Contract Create Error", e);
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
