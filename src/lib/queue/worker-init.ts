import { marketplaceWorker } from "../../services/marketplaces/actions/worker";
import { reportsWorker } from "../../services/reports/worker";

let isInitialized = false;

export function initMarketplaceWorker() {
    if (isInitialized) return;

    console.log(JSON.stringify({
        event: 'worker_started',
        timestamp: new Date().toISOString(),
        queue: 'marketplace-actions',
    }));

    marketplaceWorker.on('completed', (job) => {
        console.log(JSON.stringify({
            event: 'job_completed',
            timestamp: new Date().toISOString(),
            jobId: job.id,
            jobName: job.name,
            duration: job.finishedOn ? job.finishedOn - (job.processedOn || job.timestamp) : null,
        }));
    });

    marketplaceWorker.on('failed', (job, err) => {
        console.error(JSON.stringify({
            event: 'job_failed',
            timestamp: new Date().toISOString(),
            jobId: job?.id,
            jobName: job?.name,
            error: err.message,
            stack: err.stack,
            attemptsMade: job?.attemptsMade,
        }));
    });

    marketplaceWorker.on('active', (job) => {
        console.log(JSON.stringify({
            event: 'job_active',
            timestamp: new Date().toISOString(),
            jobId: job.id,
            jobName: job.name,
        }));
    });

    try {
        reportsWorker.on('completed', (job) => console.log('Report Worker Success:', job.id));
        reportsWorker.on('failed', (job, err) => console.error('Report Worker Failed:', job?.id, err));
    } catch(e) {}

    isInitialized = true;
}
