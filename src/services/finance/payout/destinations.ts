import { PrismaClient } from '@prisma/client';
import { encryptIban, maskIban, maskHolderName } from './pii';
import { PayoutError } from './errors';

const prisma = new PrismaClient();

export async function createPayoutDestination(params: {
    sellerTenantId: string;
    rawIban: string;
    holderName: string;
    setDefault: boolean;
}) {
    const { sellerTenantId, rawIban, holderName, setDefault } = params;

    if (!rawIban || rawIban.trim().length < 15) {
        throw new PayoutError('Invalid IBAN format', 'INVALID_IBAN');
    }
    if (!holderName || holderName.trim().length === 0) {
        throw new PayoutError('Holder name is required', 'MISSING_HOLDER_NAME');
    }

    const mIban = maskIban(rawIban);

    // Idempotency / Duplicate Check
    const existing = await prisma.payoutDestination.findUnique({
        where: {
            sellerTenantId_ibanMasked: {
                sellerTenantId: sellerTenantId,
                ibanMasked: mIban
            }
        }
    });

    if (existing) {
        if (setDefault && !existing.isDefault) {
            return prisma.$transaction(async (tx) => {
                await tx.payoutDestination.updateMany({
                    where: { sellerTenantId, isDefault: true },
                    data: { isDefault: false }
                });
                return tx.payoutDestination.update({
                    where: { id: existing.id },
                    data: { isDefault: true, status: 'ACTIVE' }
                });
            });
        }
        return existing;
    }

    const encIban = encryptIban(rawIban);
    const mHolder = maskHolderName(holderName);

    return prisma.$transaction(async (tx) => {
        if (setDefault) {
            await tx.payoutDestination.updateMany({
                where: { sellerTenantId, isDefault: true },
                data: { isDefault: false }
            });
        }

        return tx.payoutDestination.create({
            data: {
                sellerTenantId,
                type: 'IBAN',
                ibanMasked: mIban,
                ibanEncrypted: encIban,
                holderNameMasked: mHolder,
                isDefault: setDefault,
                status: 'ACTIVE'
            }
        });
    });
}

export async function listPayoutDestinations(sellerTenantId: string) {
    const destinations = await prisma.payoutDestination.findMany({
        where: { sellerTenantId, status: 'ACTIVE' },
        orderBy: [
            { isDefault: 'desc' },
            { createdAt: 'desc' }
        ]
    });

    return destinations.map(d => ({
        id: d.id,
        type: d.type,
        ibanMasked: d.ibanMasked,
        holderNameMasked: d.holderNameMasked,
        isDefault: d.isDefault,
        createdAt: d.createdAt
    }));
}

export async function disablePayoutDestination(sellerTenantId: string, destinationId: string) {
    // Check if used in active payout (optional strict logic)
    const pendingCount = await prisma.payoutRequest.count({
        where: {
            sellerTenantId,
            destinationId,
            status: { in: ['REQUESTED', 'APPROVED', 'PROCESSING'] }
        }
    });

    if (pendingCount > 0) {
        throw new PayoutError('Cannot disable destination with pending payout requests', 'ACTIVE_PAYOUTS_EXIST');
    }

    const updated = await prisma.payoutDestination.updateMany({
        where: { sellerTenantId, id: destinationId },
        data: { status: 'DISABLED' }
    });

    if (updated.count === 0) {
        throw new PayoutError('Destination not found or not owned by user', 'NOT_FOUND', 404);
    }
    return { success: true };
}
