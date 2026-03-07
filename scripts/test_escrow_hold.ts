import { createEscrowHold, captureEscrowFunds, getEscrowDetails } from '../src/services/escrow/escrowService';

async function testEscrowHold() {
    console.log("=== ESCROW HOLD VALIDATOR ===");
    try {
        const prisma = (await import('../src/lib/prisma')).default;
        await prisma.tenant.upsert({ where: { id: 'buyer-1' }, update: {}, create: { id: 'buyer-1', name: 'B1', ownerEmail: 'b1@p.com', phone: '1' } });
        await prisma.tenant.upsert({ where: { id: 'seller-1' }, update: {}, create: { id: 'seller-1', name: 'S1', ownerEmail: 's1@p.com', phone: '2' } });

        const orderId = `test-order-${Date.now()}`;
        console.log(`1. Creating escrow hold for order: ${orderId}`);
        const hold = await createEscrowHold(orderId, 'buyer-1', 'seller-1', 1000);
        console.log(`✓ Escrow Created ID: ${hold.id}, Status: ${hold.status}`);

        console.log("2. Capturing funds...");
        const captured = await captureEscrowFunds(orderId);
        console.log(`✓ Funds Captured. Status: ${captured.status}`);

        console.log("3. Fetching details with events...");
        const details = await getEscrowDetails(orderId);
        console.log(`✓ Lifecycle Events recorded: ${details.lifecycleEvents.length}`);

        console.log("SUCCESS");
        process.exit(0);
    } catch (e: any) {
        console.error("FAILED:", e.message);
        process.exit(1);
    }
}

testEscrowHold();
