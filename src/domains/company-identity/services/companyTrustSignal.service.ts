import prisma from "@/lib/prisma";
import { SIGNAL_TYPES } from "../constants/trust.constants";

export async function recordTrustSignal(params: {
    tenantId: string;
    signalType: string;
    signalValue: number;
    weight: number;
    sourceRef?: string;
}) {
    return prisma.companyTrustSignal.create({
        data: {
            tenantId: params.tenantId,
            signalType: params.signalType,
            signalValue: params.signalValue,
            weight: params.weight,
            sourceRef: params.sourceRef,
        },
    });
}

export async function listTrustSignals(tenantId: string) {
    return prisma.companyTrustSignal.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
    });
}

export async function aggregateTrustInputs(tenantId: string) {
    // 1. Get Identity Status
    const identity = await prisma.companyIdentity.findUnique({
        where: { tenantId },
    });
    const identityVerified = identity?.verificationStatus === "VERIFIED";

    // 2. Fetch and aggregate signals from DB
    const signals = await prisma.companyTrustSignal.findMany({
        where: { tenantId },
    });

    const aggs = {
        [SIGNAL_TYPES.TRADE_COMPLETION_RATE]: { sum: 0, weightSum: 0 },
        [SIGNAL_TYPES.SHIPPING_RELIABILITY]: { sum: 0, weightSum: 0 },
        [SIGNAL_TYPES.PAYMENT_RELIABILITY]: { sum: 0, weightSum: 0 },
        [SIGNAL_TYPES.DISPUTE_RATE]: { sum: 0, weightSum: 0 },
    };

    signals.forEach((s) => {
        if (aggs[s.signalType]) {
            aggs[s.signalType].sum += s.signalValue * s.weight;
            aggs[s.signalType].weightSum += s.weight;
        }
    });

    const calcAgg = (type: string, fallback: number) => {
        const agg = aggs[type];
        if (agg.weightSum === 0) return fallback;
        return agg.sum / agg.weightSum;
    };

    // We fallback to 1.0 (perfect) for good behaviors if no signals yet, to not unfairly punish new tenants. 
    // For disputes, we fallback to 0.0 (no disputes).
    return {
        identityVerified,
        tradeCompletionRate: calcAgg(SIGNAL_TYPES.TRADE_COMPLETION_RATE, 1.0),
        shippingReliability: calcAgg(SIGNAL_TYPES.SHIPPING_RELIABILITY, 1.0),
        paymentReliability: calcAgg(SIGNAL_TYPES.PAYMENT_RELIABILITY, 1.0),
        disputeRate: calcAgg(SIGNAL_TYPES.DISPUTE_RATE, 0.0),
    };
}
