import prisma from '@/lib/prisma';
import { publishEvent } from '@/lib/events/dispatcher';
import { resolveEffectiveRoutingPolicy } from './policy';
import { scoreSupplierForRFQ } from './supplierScoring';

export async function prepareRoutingSession(rfqId: string, buyerTenantId: string) {
    const policy = await resolveEffectiveRoutingPolicy(buyerTenantId);

    // Check if session exists
    let session = await prisma.rFQRoutingSession.findUnique({
        where: { rfqId }
    });

    if (session) {
        return session;
    }

    const mode = policy.autoRoutingEnabled && !policy.requireManualApprovalBeforeSend ? 'AUTO' : 'ASSISTED';

    session = await prisma.rFQRoutingSession.create({
        data: {
            rfqId,
            buyerTenantId,
            status: 'DRAFT',
            routingMode: mode,
            currentWave: 1
        }
    });

    await publishEvent({
        type: 'NETWORK_RFQ_ROUTING_PREPARED',
        tenantId: buyerTenantId,
        meta: { sessionId: session.id, rfqId }
    });

    return session;
}

export async function generateSupplierCandidatesForRFQ(rfqId: string, buyerTenantId: string, categories: string[]) {
    // 1. Fetch potential suppliers
    // Just a mock of fetching all companies with capabilities matching categories
    const matchingCapabilities = await prisma.networkCapability.findMany({
        where: { categoryId: { in: categories } },
        include: { profile: true }
    });

    // Determine unique candidates
    const uniqueProfiles = Array.from(new Set(matchingCapabilities.map(c => c.profileId))) as string[];

    const policy = await resolveEffectiveRoutingPolicy(buyerTenantId);

    // Filter by allowed/banned
    const excludedIds: string[] = (policy.excludedSupplierIds as string[]) || [];
    const validProfiles = uniqueProfiles.filter(pId => excludedIds.indexOf(pId) === -1);

    // 2. Score them
    const scoredCandidates = [];
    for (const profileId of validProfiles) {
        const score = await scoreSupplierForRFQ(rfqId, buyerTenantId, profileId);

        // Filter by min constraints
        if (score.score >= policy.minTrustScore && score.confidence >= policy.minConfidenceScore) {
            scoredCandidates.push(score);
        }
    }

    return scoredCandidates;
}

export async function buildRoutingWaves(sessionId: string) {
    const session = await prisma.rFQRoutingSession.findUnique({
        where: { id: sessionId }
    });
    if (!session) throw new Error("Session not found");

    const policy = await resolveEffectiveRoutingPolicy(session.buyerTenantId);

    // Fetch top candidates
    const candidates = await prisma.networkSupplierScore.findMany({
        where: { rfqId: session.rfqId },
        orderBy: { score: 'desc' }
    });

    let waveNumber = 1;

    // Distribute among waves
    if (policy.allowWaveRouting && candidates.length > policy.maxPrimarySuppliers) {
        // Wave 1
        await prisma.rFQRoutingWave.create({
            data: {
                sessionId,
                waveNumber: 1,
                plannedSuppliersCount: policy.maxPrimarySuppliers,
                status: 'PENDING'
            }
        });

        // Wave 2 (Fallback)
        await prisma.rFQRoutingWave.create({
            data: {
                sessionId,
                waveNumber: 2,
                plannedSuppliersCount: Math.min(policy.maxFallbackSuppliers, candidates.length - policy.maxPrimarySuppliers),
                status: 'PENDING'
            }
        });
    } else {
        await prisma.rFQRoutingWave.create({
            data: {
                sessionId,
                waveNumber: 1,
                plannedSuppliersCount: Math.min(policy.maxPrimarySuppliers, candidates.length),
                status: 'PENDING'
            }
        });
    }

    await prisma.rFQRoutingSession.update({
        where: { id: sessionId },
        data: {
            status: 'READY',
            totalCandidates: candidates.length
        }
    });

    return session;
}

export async function routeRFQWave(sessionId: string, waveNumber: number) {
    const session = await prisma.rFQRoutingSession.findUnique({
        where: { id: sessionId },
        include: { waves: true }
    });
    if (!session) throw new Error("Session not found");

    const wave = session.waves.find(w => w.waveNumber === waveNumber);
    if (!wave) throw new Error("Wave not found");

    // Mock processing - logic to actually send messages to Supplier instances
    console.log(`Routing wave ${waveNumber} for session ${sessionId}`);

    await prisma.rFQRoutingWave.update({
        where: { id: wave.id },
        data: {
            status: 'COMPLETED',
            routedSuppliersCount: wave.plannedSuppliersCount,
            completedAt: new Date()
        }
    });

    await prisma.rFQRoutingSession.update({
        where: { id: sessionId },
        data: {
            status: waveNumber === session.waves.length ? 'COMPLETED' : 'PARTIALLY_ROUTED',
            currentWave: waveNumber,
            completedAt: waveNumber === session.waves.length ? new Date() : null
        }
    });

    await publishEvent({
        type: 'NETWORK_RFQ_WAVE_ROUTED',
        tenantId: session.buyerTenantId,
        meta: { sessionId, waveId: wave.id, count: wave.plannedSuppliersCount }
    });

    return wave;
}

export async function completeRoutingSession(sessionId: string) {
    return prisma.rFQRoutingSession.update({
        where: { id: sessionId },
        data: { status: 'COMPLETED', completedAt: new Date() }
    });
}

export async function cancelRoutingSession(sessionId: string) {
    return prisma.rFQRoutingSession.update({
        where: { id: sessionId },
        data: { status: 'CANCELED', completedAt: new Date() }
    });
}
