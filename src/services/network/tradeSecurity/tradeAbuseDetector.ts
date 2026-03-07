import { PrismaClient, NetworkTradeAbuseSignalType } from '@prisma/client';

const prisma = new PrismaClient();

export class TradeAbuseDetector {

    static async scanForSpamAbuse(tenantId: string) {
        // Mock checking rate limits on RFQ/Proposals
        const suspiciousActivity = Math.random() > 0.8; // 20% chance to flag

        if (suspiciousActivity) {
            const severityScore = Math.random() * 50 + 50; // 50-100 score
            console.log(`[TradeAbuseDetector] 🚨 Flagged ${tenantId} for potential RFQ SPAM. Sev: ${severityScore}`);

            await prisma.networkTradeAbuseSignal.create({
                data: {
                    tenantId,
                    signalType: NetworkTradeAbuseSignalType.RFQ_SPAM,
                    severityScore,
                    contextJson: { reason: "High volume of proposals in 24h window beyond historic averages" }
                }
            });
            return { detected: true, severityScore };
        }
        return { detected: false };
    }

    static async detectPriceManipulation(tenantId: string) {
        // Look for coordinated artificial high/low pricing
        // For mock, 10% chance
        const manipulation = Math.random() > 0.9;
        if (manipulation) {
            await prisma.networkTradeAbuseSignal.create({
                data: {
                    tenantId,
                    signalType: NetworkTradeAbuseSignalType.PRICE_MANIPULATION,
                    severityScore: 90,
                    contextJson: { reason: "Price bands fall outside statistical variance." }
                }
            });
            return true;
        }
        return false;
    }
}
