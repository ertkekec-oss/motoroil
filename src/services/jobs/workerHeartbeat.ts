import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class WorkerHeartbeatService {

    /**
     * Call every 10 seconds to keep worker registered alive.
     */
    static async recordWorkerHeartbeat(workerName: string, queueName: string) {
        return await prisma.systemWorkerHeartbeat.upsert({
            where: { workerName },
            update: { lastHeartbeatAt: new Date(), queueName },
            create: { workerName, queueName, lastHeartbeatAt: new Date() }
        });
    }

    /**
     * Lists all workers known to cluster.
     */
    static async listWorkerHealth() {
        return await prisma.systemWorkerHeartbeat.findMany({
            orderBy: { lastHeartbeatAt: 'desc' }
        });
    }

    /**
     * Detects workers missing for more than 5 minutes.
     */
    static async detectZombieWorkers() {
        const threshold = new Date(Date.now() - 300000); // 5 minutes lag
        const zombies = await prisma.systemWorkerHeartbeat.findMany({
            where: { lastHeartbeatAt: { lt: threshold } }
        });

        if (zombies.length > 0) {
            console.warn(`[WORKER_HEALTH] Detected ${zombies.length} Zombie disconnected workers in cluster!`);
            // Typically clean up their hanging locks.
            await require('./jobLocking').JobLocking.recoverExpiredLocks();
        }
        return zombies;
    }
}
