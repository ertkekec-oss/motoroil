import { createEscrowHold, captureEscrowFunds, getEscrowDetails } from '../src/services/escrow/escrowService';
import { executeRelease } from '../src/services/escrow/escrowReleaseEngine';
import { transitionEscrowState } from '../src/services/escrow/escrowStateMachine';
import prisma from '../src/lib/prisma';

async function testRelease() {
    console.log("=== ESCROW RELEASE VALIDATOR ===");
    try {
        await prisma.tenant.upsert({ where: { id: 'buyer-req-1' }, update: {}, create: { id: 'buyer-req-1', name: 'B', ownerEmail: 'b', phone: '1' } });
        await prisma.tenant.upsert({ where: { id: 'seller-req-1' }, update: {}, create: { id: 'seller-req-1', name: 'S', ownerEmail: 's', phone: '2' } });

        const orderId = `test-release-${Date.now()}`;
        console.log(`1. Creating & Capturing Escrow Hold`);
        await createEscrowHold(orderId, 'buyer-req-1', 'seller-req-1', 2500);
        await captureEscrowFunds(orderId);

        let details = await getEscrowDetails(orderId);

        console.log(`2. Forcing state to DELIVERY_CONFIRMED for test`);
        await transitionEscrowState(details.id, 'DELIVERY_CONFIRMED', 'SHIPMENT_DELIVERED', { source: 'SYSTEM' });

        console.log(`3. Executing Release Engine`);
        await executeRelease(details.id);

        details = await getEscrowDetails(orderId);
        console.log(`✓ Escrow Released. Current state: ${details.status}`);
        if (details.status !== 'RELEASED') throw new Error("Status did not change to RELEASED");

        // Ledger Check
        const sellerAccount = await prisma.networkEscrowAccount.findUnique({
            where: { tenantId: 'seller-req-1' }
        });
        console.log(`✓ Seller Available Balance: ${sellerAccount?.availableBalance}`);

        console.log("SUCCESS");
        process.exit(0);
    } catch (e: any) {
        console.error("FAILED:", e.message);
        process.exit(1);
    }
}

testRelease();
