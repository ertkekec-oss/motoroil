import { createEscrowHold } from '../src/services/escrow/escrowService';
import { transitionEscrowState } from '../src/services/escrow/escrowStateMachine';

async function testStateMachine() {
    console.log("=== ESCROW STATE MACHINE VALIDATOR ===");
    try {
        const prisma = (await import('../src/lib/prisma')).default;
        await prisma.tenant.upsert({ where: { id: 'buyer-3' }, update: {}, create: { id: 'buyer-3', name: 'B3', ownerEmail: 'b3', phone: '1' } });
        await prisma.tenant.upsert({ where: { id: 'seller-3' }, update: {}, create: { id: 'seller-3', name: 'S3', ownerEmail: 's3', phone: '2' } });
        const orderId = `test-sm-${Date.now()}`;
        console.log(`1. Creating default state: CREATED`);
        const hold = await createEscrowHold(orderId, 'buyer-3', 'seller-3', 100);

        console.log(`2. Attempting invalid transition: CREATED -> RELEASED`);
        try {
            await transitionEscrowState(hold.id, 'RELEASED', 'ESCROW_RELEASED', { source: 'SYSTEM' });
            throw new Error("Did not block invalid transition");
        } catch (err: any) {
            console.log(`✓ Blocked invalid transition successfully (${err.message})`);
        }

        console.log(`3. Executing valid transition: CREATED -> CANCELED`);
        const canceled = await transitionEscrowState(hold.id, 'CANCELED', 'SHIPMENT_DELIVERY_FAILED', { source: 'SYSTEM' });
        console.log(`✓ Escrow safely moved to CANCELED`);

        console.log("SUCCESS");
        process.exit(0);
    } catch (e: any) {
        console.error("FAILED:", e.message);
        process.exit(1);
    }
}

testStateMachine();
