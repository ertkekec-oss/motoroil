import { createEscrowHold, captureEscrowFunds, getEscrowDetails } from '../src/services/escrow/escrowService';
import { handleShippingEvent } from '../src/services/escrow/shippingHooks';

async function testHook() {
    console.log("=== ESCROW SHIPPING HOOK VALIDATOR ===");
    try {
        const prisma = (await import('../src/lib/prisma')).default;
        await prisma.tenant.upsert({ where: { id: 'buyer-2' }, update: {}, create: { id: 'buyer-2', name: 'B2', ownerEmail: 'b2', phone: '1' } });
        await prisma.tenant.upsert({ where: { id: 'seller-2' }, update: {}, create: { id: 'seller-2', name: 'S2', ownerEmail: 's2', phone: '2' } });
        const orderId = `test-hook-${Date.now()}`;
        console.log(`1. Creating & Capturing Escrow Hold`);
        await createEscrowHold(orderId, 'buyer-2', 'seller-2', 500);
        await captureEscrowFunds(orderId);

        console.log(`2. Triggering IN_TRANSIT Shipping Event`);
        await handleShippingEvent('ship-mock-1', orderId, 'IN_TRANSIT');

        let details = await getEscrowDetails(orderId);
        console.log(`✓ Escrow automatically transitioned to: ${details.status}`);
        if (details.status !== 'IN_TRANSIT') throw new Error("Status did not process hook correctly");

        console.log(`3. Triggering DELIVERED Shipping Event`);
        await handleShippingEvent('ship-mock-1', orderId, 'DELIVERED');
        details = await getEscrowDetails(orderId);
        console.log(`✓ Escrow automatically transitioned to: ${details.status}`);

        console.log("SUCCESS");
        process.exit(0);
    } catch (e: any) {
        console.error("FAILED:", e.message);
        process.exit(1);
    }
}

testHook();
