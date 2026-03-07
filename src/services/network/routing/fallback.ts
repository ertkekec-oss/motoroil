import prisma from '@/lib/prisma';
import { publishEvent } from '@/lib/events/dispatcher';

export async function shouldTriggerFallback(sessionId: string) {
    const session = await prisma.rFQRoutingSession.findUnique({
        where: { id: sessionId },
        include: { waves: true }
    });

    if (!session || session.status === 'COMPLETED' || session.status === 'CANCELED') return false;

    // Check if the current wave has been IN_PROGRESS or COMPLETED for more than 48 hours
    // (A heuristic for timeout, normally we check RFQ response rate in DB)
    const activeWave = session.waves.find(w => w.waveNumber === session.currentWave);
    if (!activeWave || !activeWave.completedAt) return false;

    const timeDiffMs = Date.now() - activeWave.completedAt.getTime();
    const hoursPassed = timeDiffMs / (1000 * 60 * 60);

    // If more than 24 hours passed without enough responses, trigger fallback
    // In actual implementation, we'd query received bids for this RFQ compared to plannedSuppliersCount.
    return hoursPassed > 24;
}

export async function triggerNextWaveIfNeeded(sessionId: string) {
    if (await shouldTriggerFallback(sessionId)) {
        const session = await prisma.rFQRoutingSession.findUnique({
            where: { id: sessionId },
            include: { waves: true }
        });

        if (!session) return;

        const nextWaveNum = session.currentWave + 1;
        const nextWave = session.waves.find(w => w.waveNumber === nextWaveNum && w.status === 'PENDING');

        if (nextWave) {
            console.log(`[Fallback Engine] Triggering Fallback Wave ${nextWaveNum} for session ${sessionId}`);

            await prisma.rFQRoutingWave.update({
                where: { id: nextWave.id },
                data: {
                    status: 'IN_PROGRESS',
                    startedAt: new Date()
                }
            });

            await publishEvent({
                type: 'NETWORK_RFQ_FALLBACK_TRIGGERED',
                tenantId: session.buyerTenantId,
                meta: { sessionId, waveId: nextWave.id, waveNumber: nextWaveNum }
            });

            return nextWave;
        }
    }
    return null;
}
