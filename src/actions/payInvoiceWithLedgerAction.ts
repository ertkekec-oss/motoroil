"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function payInvoiceWithLedgerAction(invoiceId: string) {
    const session: any = await getSession();
    if (!session?.companyId) {
        throw new Error("Unauthorized");
    }

    const sellerTenantId = session.companyId;

    const invoice = await prisma.boostInvoice.findUnique({
        where: { id: invoiceId }
    });

    if (!invoice || invoice.sellerTenantId !== sellerTenantId) {
        throw new Error("Fatura bulunamadı veya yetkisiz erişim.");
    }

    if (invoice.status === "PAID" || invoice.collectionStatus === "PAID") {
        throw new Error("Bu fatura zaten ödenmiş.");
    }

    await prisma.$transaction(async (tx) => {
        // Find seller's ledger account
        const ledger = await tx.ledgerAccount.findUnique({
            where: { companyId: sellerTenantId }
        });

        if (!ledger) {
            throw new Error("Ledger (Cüzdan) hesabınız bulunamadı.");
        }

        const invAmount = Number(invoice.amount);
        const availBalance = Number(ledger.availableBalance);

        if (availBalance < invAmount) {
            throw new Error(`Cüzdandaki serbest bakiyeniz yetersiz. Bakiye: ${availBalance} ₺, Fatura: ${invAmount} ₺`);
        }

        // 1. Deduct from Ledger Available Balance
        await tx.ledgerAccount.update({
            where: { id: ledger.id },
            data: { 
                availableBalance: { decrement: invAmount } 
            }
        });

        // 2. Mark Invoice as PAID
        await tx.boostInvoice.update({
            where: { id: invoice.id },
            data: {
                status: "PAID",
                collectionStatus: "PAID",
                paidAt: new Date()
            }
        });

        // 3. Optional: Lift Subscription block if it exists
        if (invoice.subscriptionId) {
            // Check if there are ANY other UNPAID OVERDUE invoices for this subscription
            const pendingOverdue = await tx.boostInvoice.count({
                where: {
                    subscriptionId: invoice.subscriptionId,
                    collectionStatus: "OVERDUE",
                    id: { not: invoice.id }
                }
            });

            // If none are overdue anymore, remove the billing lock!
            if (pendingOverdue === 0) {
                await tx.subscription.update({
                    where: { id: invoice.subscriptionId },
                    data: { billingBlocked: false }
                });
            }
        }
    });

    revalidatePath("/hub/finance");
    return { success: true };
}
