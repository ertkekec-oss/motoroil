import { PrismaClient, Prisma } from '@prisma/client';
import { withIdempotency } from '../../../lib/idempotency';
import { allocateShipmentShippingCost } from './allocate';
import { ShippingError } from './errors';

const prisma = new PrismaClient();
const PLATFORM_TENANT_CONST = 'PLATFORM_TENANT'; // Defined constant for platform entries

export async function ensureLedgerAccount(
    tx: Prisma.TransactionClient,
    companyId: string,
    currency: string = 'TRY'
) {
    let acc = await tx.ledgerAccount.findUnique({
        where: { companyId },
    });
    if (!acc) {
        acc = await tx.ledgerAccount.create({
            data: {
                companyId,
                currency,
                availableBalance: new Prisma.Decimal(0),
                pendingBalance: new Prisma.Decimal(0),
            },
        });
    }
    return acc;
}

export async function postShippingChargeback(lineId: string) {
    const line = await prisma.shippingInvoiceLine.findUnique({
        where: { id: lineId },
        include: { shipment: true, invoice: true }
    });

    if (!line || !line.sellerTenantId || !line.shipmentId || (line.matchStatus !== 'MATCHED' && line.matchStatus !== 'RECONCILED')) {
        throw new ShippingError(`Line ${lineId} is not MATCHED or missing required relations.`);
    }

    const idempotencyKey = `SHIPPING_POSTING:line:${line.id}`;
    const amount = line.chargeAmount;
    const currency = line.invoice.currency || 'TRY';

    try {
        return await withIdempotency(
            prisma,
            idempotencyKey,
            'SHIPPING_POSTING',
            line.sellerTenantId,
            async (tx) => {
                // 1. Get or create ledger accounts
                const sellerAccount = await ensureLedgerAccount(tx, line.sellerTenantId!, currency);
                const platformAccount = await ensureLedgerAccount(tx, PLATFORM_TENANT_CONST, currency);

                // 2. Create Ledger Group
                const ledgerGroup = await tx.ledgerGroup.create({
                    data: {
                        idempotencyKey: idempotencyKey,
                        tenantId: line.sellerTenantId!,
                        type: 'SHIPPING_CHARGEBACK',
                        description: `Chargeback for shipment ${line.shipmentId} tracking ${line.trackingNo}`,
                    },
                });

                // 6. Earning Update (Reporting Cache) & Balance Logic
                const earning = await tx.sellerEarning.findUnique({
                    where: { shipmentId: line.shipmentId! },
                });

                let available = new Prisma.Decimal(sellerAccount.availableBalance);
                let actualPayableDebit = amount;
                let receivableDebit = new Prisma.Decimal(0);

                if (earning?.status === 'RELEASED') {
                    if (available.lessThan(amount)) {
                        actualPayableDebit = available;
                        receivableDebit = amount.minus(available);
                    }
                } else {
                    // If not released, we just debit payable. In a fully implemented 
                    // Ledger-Truth system, the unreleased funds are in Escrow. 
                    // For now, depending on rules, we might just create a receivable 
                    // or let payable go negative if we don't strict-enforce.
                    // The rule says "Eğer earning RELEASED ve availableBalance yeterli..."
                    // We will apply the max(0) and receivable rule generally if we want to 
                    // protect availableBalance from being negative.
                    if (available.lessThan(amount)) {
                        actualPayableDebit = available;
                        receivableDebit = amount.minus(available);
                    }
                }

                // 3. Insert Balanced Entries
                const entriesData: any[] = [
                    // Platform Tenant
                    {
                        tenantId: PLATFORM_TENANT_CONST,
                        ledgerAccountId: platformAccount.id,
                        groupId: ledgerGroup.id,
                        accountType: 'SHIPPING_EXPENSE',
                        direction: 'DEBIT',
                        amount: amount,
                        currency,
                        refType: 'SHIPPING_LINE',
                        referenceId: line.id,
                    },
                    {
                        tenantId: PLATFORM_TENANT_CONST,
                        ledgerAccountId: platformAccount.id,
                        groupId: ledgerGroup.id,
                        accountType: 'PLATFORM_INTERCO_CLEARING',
                        direction: 'CREDIT',
                        amount: amount,
                        currency,
                        refType: 'SHIPPING_LINE',
                        referenceId: line.id,
                    },
                    // Seller Tenant
                    {
                        tenantId: line.sellerTenantId!,
                        ledgerAccountId: sellerAccount.id,
                        groupId: ledgerGroup.id,
                        accountType: 'SELLER_INTERCO_CLEARING',
                        direction: 'CREDIT',
                        amount: amount,
                        currency,
                        refType: 'SHIPPING_LINE',
                        referenceId: line.id,
                    }
                ];

                if (actualPayableDebit.greaterThan(0)) {
                    entriesData.push({
                        tenantId: line.sellerTenantId!,
                        ledgerAccountId: sellerAccount.id,
                        groupId: ledgerGroup.id,
                        accountType: 'SELLER_PAYABLE',
                        direction: 'DEBIT',
                        amount: actualPayableDebit,
                        currency,
                        refType: 'SHIPPING_LINE',
                        referenceId: line.id,
                    });
                }

                if (receivableDebit.greaterThan(0)) {
                    entriesData.push({
                        tenantId: line.sellerTenantId!,
                        ledgerAccountId: sellerAccount.id,
                        groupId: ledgerGroup.id,
                        accountType: 'SELLER_CHARGEBACK_RECEIVABLE',
                        direction: 'DEBIT',
                        amount: receivableDebit,
                        currency,
                        refType: 'SHIPPING_LINE',
                        referenceId: line.id,
                    });
                }

                await tx.ledgerEntry.createMany({ data: entriesData });

                // Update available balance based on what we deducted from SELLER_PAYABLE
                if (actualPayableDebit.greaterThan(0)) {
                    const newBalance = available.minus(actualPayableDebit);
                    await tx.ledgerAccount.update({
                        where: { id: sellerAccount.id },
                        data: { availableBalance: newBalance }
                    });
                }

                // 4. Update Invoice Line Status
                await tx.shippingInvoiceLine.update({
                    where: { id: line.id },
                    data: { matchStatus: 'RECONCILED' },
                });

                // 5. Update Cost Allocation
                const existingAlloc = await tx.shipmentCostAllocation.findFirst({
                    where: { shipmentId: line.shipmentId!, shippingInvoiceLineId: line.id },
                });
                if (!existingAlloc) {
                    await tx.shipmentCostAllocation.create({
                        data: {
                            shipmentId: line.shipmentId!,
                            shippingInvoiceLineId: line.id,
                            model: 'CHARGEBACK_SELLER',
                            sellerShareAmount: amount,
                            platformShareAmount: new Prisma.Decimal(0),
                            buyerShareAmount: new Prisma.Decimal(0),
                        },
                    });
                }

                // 6. Update SellerEarning (Already fetched above as `earning`)

                if (earning) {
                    const chargebackAmount = new Prisma.Decimal(earning.chargebackAmount).plus(amount);
                    const netAmount = new Prisma.Decimal(earning.grossAmount)
                        .minus(new Prisma.Decimal(earning.commissionAmount))
                        .minus(chargebackAmount);

                    await tx.sellerEarning.update({
                        where: { id: earning.id },
                        data: {
                            // Reporting cache update. The real truth is in LedgerEntries.
                            chargebackAmount: chargebackAmount,
                            netAmount: netAmount,
                        }
                    });
                }

                return ledgerGroup;
            }
        );
    } catch (err: any) {
        if (err.message === 'ALREADY_SUCCEEDED') {
            return prisma.ledgerGroup.findUnique({
                where: { idempotencyKey },
                include: { entries: true },
            });
        }
        throw err;
    }
}
