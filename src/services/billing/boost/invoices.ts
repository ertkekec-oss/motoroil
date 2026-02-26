import { PrismaClient, BoostInvoiceStatus } from '@prisma/client';
import { withIdempotency } from '../../../lib/idempotency';
import { v4 as uuidv4 } from 'uuid';
import { ensureLedgerAccount } from '../../finance/shipping/postChargeback';

const prisma = new PrismaClient();

export async function issueBoostInvoice({
    adminUserId,
    subscriptionId,
    periodKey
}: {
    adminUserId: string;
    subscriptionId: string;
    periodKey: string;
}) {
    const idempotencyKey = `BOOST_INVOICE_ISSUE:${subscriptionId}:${periodKey}`;
    
    return withIdempotency(prisma, idempotencyKey, 'BOOST_INVOICE', 'PLATFORM', async (tx) => {
        // 1. Fetch Subscription
        const sub = await tx.boostSubscription.findUnique({
            where: { id: subscriptionId },
            include: { plan: true }
        });

        if (!sub) throw new Error('Subscription not found');
        if (sub.status !== 'ACTIVE') throw new Error(`Cannot issue invoice for ${sub.status} subscription`);

        // 2. Check if invoice already exists
        const existing = await tx.boostInvoice.findUnique({
            where: { subscriptionId_periodKey: { subscriptionId, periodKey } }
        });

        if (existing) {
             throw new Error('Invoice already issued for this period');
        }

        // 3. Create AR/Revenue Ledger
        const platformAccount = await ensureLedgerAccount(tx, 'PLATFORM_TENANT', sub.plan.currency);
        const lgId = `GRP_AR_${uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase()}`;
        const lg = await tx.ledgerGroup.create({
            data: {
                id: lgId,
                type: 'INVOICE_ISSUED',
                tenantId: 'PLATFORM',
                idempotencyKey,
                description: `Boost Invoice AR for ${periodKey}`,
                entries: {
                    create: [
                        { ledgerAccountId: platformAccount.id, accountType: 'ACCOUNTS_RECEIVABLE', tenantId: 'PLATFORM', direction: 'DEBIT', amount: sub.plan.monthlyPrice, currency: sub.plan.currency },
                        { ledgerAccountId: platformAccount.id, accountType: 'BOOST_REVENUE', tenantId: 'PLATFORM', direction: 'CREDIT', amount: sub.plan.monthlyPrice, currency: sub.plan.currency }
                    ]
                }
            }
        });

        // 4. Create Invoice
        const inv = await tx.boostInvoice.create({
            data: {
                sellerTenantId: sub.sellerTenantId,
                subscriptionId: sub.id,
                periodKey,
                amount: sub.plan.monthlyPrice,
                currency: sub.plan.currency,
                status: 'ISSUED',
                issuedAt: new Date(),
                dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
                ledgerGroupId: lg.id
            }
        });

        // 5. Update Subscription
        await tx.boostSubscription.update({
            where: { id: sub.id },
            data: { lastChargedPeriodKey: periodKey }
        });

        // 6. Audit
        await tx.financeOpsLog.create({
            data: {
                action: 'BOOST_INVOICE_ISSUED',
                entityType: 'BoostInvoice',
                entityId: inv.id,
                severity: 'INFO',
                payloadJson: { adminUserId, periodKey, amount: sub.plan.monthlyPrice }
            }
        });

        return inv;
    });
}

export async function markBoostInvoicePaid({
    adminUserId,
    invoiceId
}: {
    adminUserId: string;
    invoiceId: string;
}) {
    const idempotencyKey = `BOOST_INVOICE_PAYMENT:${invoiceId}`;

    return withIdempotency(prisma, idempotencyKey, 'BOOST_PAYMENT', 'PLATFORM', async (tx) => {
         const inv = await tx.boostInvoice.findUnique({
             where: { id: invoiceId }
         });

         if (!inv) throw new Error('Invoice not found');
         if (inv.status === 'PAID') return inv; // already paid
         if (inv.status !== 'ISSUED') throw new Error(`Cannot pay invoice in status ${inv.status}`);

         // 1. Ledger (CASH vs AR)
         const platformAccount = await ensureLedgerAccount(tx, 'PLATFORM_TENANT', inv.currency);
         const lgId = `GRP_PAY_${uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase()}`;
         await tx.ledgerGroup.create({
             data: {
                 id: lgId,
                 type: 'INVOICE_PAYMENT',
                 tenantId: 'PLATFORM',
                 idempotencyKey,
                 description: `Boost Payment for ${inv.periodKey}`,
                 entries: {
                     create: [
                          { ledgerAccountId: platformAccount.id, accountType: 'PLATFORM_WALLET', tenantId: 'PLATFORM', direction: 'DEBIT', amount: inv.amount, currency: inv.currency },
                          { ledgerAccountId: platformAccount.id, accountType: 'ACCOUNTS_RECEIVABLE', tenantId: 'PLATFORM', direction: 'CREDIT', amount: inv.amount, currency: inv.currency }
                     ]
                 }
             }
         });

         // 2. Update Invoice
         const updatedInv = await tx.boostInvoice.update({
             where: { id: inv.id },
             data: {
                 status: 'PAID',
                 paidAt: new Date()
             }
         });

         // 3. Audit
         await tx.financeOpsLog.create({
             data: {
                 action: 'BOOST_INVOICE_PAID',
                 entityType: 'BoostInvoice',
                 entityId: inv.id,
                 severity: 'INFO',
                 payloadJson: { adminUserId, amount: inv.amount }
             }
         });

         return updatedInv;
    });
}
