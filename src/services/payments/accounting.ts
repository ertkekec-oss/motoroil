import { prisma } from "@/lib/prisma";
import { B2BJournalSourceType } from "@prisma/client";

export async function createSettlementJournalEntry(params: {
    tenantId: string;
    sourceType: B2BJournalSourceType;
    sourceId: string;
    description: string;
    amount: number;
    currency: string;
    debitAccountCode: string;
    creditAccountCode: string;
}) {
    const { tenantId, sourceType, sourceId, description, amount, currency, debitAccountCode, creditAccountCode } = params;

    // First ensure accounts exist
    const [debitAcc, creditAcc] = await Promise.all([
        getOrCreateLedgerAccount(tenantId, debitAccountCode),
        getOrCreateLedgerAccount(tenantId, creditAccountCode)
    ]);

    // Create Entry and Lines inside transaction
    return prisma.$transaction(async (tx) => {
        const entry = await tx.b2BJournalEntry.create({
            data: {
                tenantId,
                sourceType,
                sourceId,
                lines: {
                    create: [
                        {
                            tenantId,
                            accountId: debitAcc.id,
                            debit: amount,
                            credit: 0,
                            currency,
                            description
                        },
                        {
                            tenantId,
                            accountId: creditAcc.id,
                            debit: 0,
                            credit: amount,
                            currency,
                            description
                        }
                    ]
                }
            }
        });

        return entry;
    });
}

async function getOrCreateLedgerAccount(tenantId: string, code: string) {
    let acc = await prisma.b2BLedgerAccount.findUnique({
        where: { tenantId_code: { tenantId, code } }
    });

    if (!acc) {
        // Fallback names based on typical accounts
        let name = "System Account";
        let type: any = "ASSET";

        if (code === "102") { name = "Banks"; type = "ASSET"; }
        if (code === "320") { name = "Suppliers (AP)"; type = "LIABILITY"; }
        if (code === "336") { name = "Escrow Liability"; type = "LIABILITY"; }

        acc = await prisma.b2BLedgerAccount.create({
            data: {
                tenantId,
                code,
                name,
                type,
                isSystem: true
            }
        });
    }

    return acc;
}
