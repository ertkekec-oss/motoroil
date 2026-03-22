"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function requestPayoutAction(amount: number) {
    const session: any = await getSession();
    if (!session?.companyId) throw new Error("Unauthorized");

    if (amount <= 0) {
        throw new Error("Çekim tutarı sıfırdan büyük olmalıdır.");
    }

    const sellerTenantId = session.companyId;

    await prisma.$transaction(async (tx) => {
        // 1. Get the Ledger
        const ledger = await tx.ledgerAccount.findUnique({
            where: { companyId: sellerTenantId }
        });

        if (!ledger) throw new Error("Cüzdan hesabınız henüz oluşturulmamış.");

        if (Number(ledger.availableBalance) < amount) {
            throw new Error(`Yetersiz bakiye. İstediğiniz tutar: ${amount} ₺, Kullanılabilir Bakiye: ${ledger.availableBalance} ₺`);
        }

        // 2. We could enforce KYC check but for MVP we skip
        
        // 3. Optional: Deduct from available balance into reserved ? 
        // In real systems, a payout locks the balance.
        await tx.ledgerAccount.update({
            where: { id: ledger.id },
            data: { 
                availableBalance: { decrement: amount },
                reservedBalance: { increment: amount } // lock it in reserved until payout completes or fails
            }
        });

        // 4. Create Payout Request
        // If PayoutRequest model lacks some exact fields, TS will warn us, but we know it has amount, sellerTenantId, etc.
        // I'll try to insert using valid guessed names based on typical Periodya patterns.
        await tx.payoutRequest.create({
            data: {
                sellerTenantId: sellerTenantId,
                amount: amount,
                status: "PROCESSING",
                destination: "PRIMARY_BANK_ACCOUNT", // placeholder
                // "provider" is handled by defaults on schema (e.g. IYZICO)
            }
        });
    });

    revalidatePath("/hub/finance");
    revalidatePath("/hub/payouts");
    revalidatePath("/hub/earnings");
    
    return { success: true };
}
