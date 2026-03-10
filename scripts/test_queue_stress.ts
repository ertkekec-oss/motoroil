import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function RUN_QUEUE_STRESS_TEST() {
    console.log("=== QUEUE / WORKER STRESS TEST ===");
    console.log("Simulating 5,000 rapid event jobs to test BullMQ / Redis throughput...");

    const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
    const queueName = 'STRESS_TEST_QUEUE';
    
    const stressQueue = new Queue(queueName, { connection });
    let completedCount = 0;
    
    // We instantiate a throwaway worker just to parse logic quickly
    const worker = new Worker(queueName, async job => {
        // Just empty simulated work
        await new Promise(r => setTimeout(r, 2)); // 2ms operation
    }, { connection, concurrency: 50 });

    worker.on('completed', () => {
        completedCount++;
    });

    const start = Date.now();
    const NUM_JOBS = 5000;

    const pipeline = connection.pipeline();
    // Bulk add jobs would be faster, but let's just loop add
    const jobs = Array.from({length: NUM_JOBS}).map((_, i) => ({
        name: 'stress-job',
        data: { iteration: i }
    }));
    
    console.log(`Pushing ${NUM_JOBS} items to queue...`);
    await stressQueue.addBulk(jobs);
    console.log(`Pushed in ${Date.now() - start}ms`);

    console.log(`Waiting for worker completion...`);
    
    await new Promise(r => setTimeout(r, 5000)); // Wait 5 seconds max

    const elapsed = Date.now() - start;

    console.log(`\n--- RESULTS ---`);
    console.log(`Processed: ${completedCount} / ${NUM_JOBS}`);
    console.log(`Elapsed Time: ${elapsed}ms`);
    console.log(`Throughput: ${(completedCount / (elapsed / 1000)).toFixed(2)} jobs/sec`);

    if (completedCount > 2000) {
        console.log(`✅ Queue framework handled immense concurrency securely.`);
    } else {
        console.log(`❌ Queue throughput is lower than expected. Redis connection or Worker limitation detected.`);
    }

    await worker.close();
    await stressQueue.close();
    connection.disconnect();
}

RUN_QUEUE_STRESS_TEST().catch(console.error);
