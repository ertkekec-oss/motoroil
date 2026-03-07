import { PrismaClient } from '@prisma/client';
import { upsertDerivedSignalSafely } from '../src/services/network/hardening/signals/signalLifecycle';

const prisma = new PrismaClient();

async function testSignalHardening() {
    console.log("=== SIGNAL LIFECYCLE HARDENING TEST ===");

    const mockProfileId = `test-prof-${Date.now()}`;
    const mockTenantId = `test-tenant-${Date.now()}`;

    // Setup Mock
    const t = await prisma.tenant.create({ data: { id: mockTenantId, name: 'SigTest', ownerEmail: 'test@s.com', phone: '123' } });
    const p = await prisma.networkCompanyProfile.create({ data: { id: mockProfileId, tenantId: t.id, slug: mockProfileId, displayName: 'ST' } });

    // 1. DEDUPE & UPSERT TEST
    console.log("Creating Signal v1...");
    const sig1: any = await upsertDerivedSignalSafely(
        prisma.networkInventorySignal,
        { tenantId: t.id, profileId: p.id, productCategoryId: 'TEST_CAT' },
        { signalType: 'HIGH_DEMAND', velocityScore: 80, confidenceScore: 90 }
    );
    console.log(`Sig1 ID: ${sig1.id}, dedupeKey: ${sig1.dedupeKey}, status: ${sig1.status}`);

    console.log("Re-inserting exactly same signal...");
    const sig2: any = await upsertDerivedSignalSafely(
        prisma.networkInventorySignal,
        { tenantId: t.id, profileId: p.id, productCategoryId: 'TEST_CAT' },
        { signalType: 'HIGH_DEMAND', velocityScore: 80, confidenceScore: 90 }
    );
    console.log(`Sig2 ID: ${sig2.id} (Should equal Sig1 ID)`);
    if (sig1.id !== sig2.id) throw new Error("Idempotency failed!");

    // 2. STALE REPLACEMENT TEST
    console.log("Inserting mutated signal (superseding old)...");
    const sig3: any = await upsertDerivedSignalSafely(
        prisma.networkInventorySignal,
        { tenantId: t.id, profileId: p.id, productCategoryId: 'TEST_CAT' },
        { signalType: 'OVERSTOCK', velocityScore: 10, confidenceScore: 90 }
    );
    console.log(`Sig3 ID: ${sig3.id},  status: ${sig3.status}`);

    const oldSig: any = await prisma.networkInventorySignal.findUnique({ where: { id: sig1.id } });
    console.log(`Old Sig Status: ${oldSig?.status}, isStale: ${oldSig?.isStale}`);
    if (oldSig?.status !== 'REPLACED') throw new Error("Stale replacement failed!");

    console.log("SUCCESS!");
    process.exit(0);
}

testSignalHardening().catch(console.error);
