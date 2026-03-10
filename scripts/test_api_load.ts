import http from 'http';
import https from 'https';

// Simple parallel connection stressor to simulate multiple requests
const RUN_API_LOAD_TEST = async () => {
    console.log('=== API THROUGHPUT & CONCURRENCY TEST ===');
    console.log('Simulating 100 concurrent incoming requests to local API endpoint...');

    const CONCURRENCY = 100;
    const ENDPOINT = 'http://localhost:3000/api/system/public/info';
    
    let successes = 0;
    let errors = 0;
    let totalTime = 0;

    const startProcessing = Date.now();

    const fetchTask = async (idx: number) => {
        const start = Date.now();
        try {
            const res = await fetch(ENDPOINT, { method: 'GET', headers: { 'Cache-Control': 'no-cache' } });
            if (res.ok) {
                successes++;
            } else {
                errors++;
            }
        } catch (e) {
            errors++;
        }
        totalTime += (Date.now() - start);
    };

    const tasks = Array.from({ length: CONCURRENCY }).map((_, i) => fetchTask(i));
    await Promise.allSettled(tasks);

    const elapsed = Date.now() - startProcessing;

    console.log(`\n--- RESULTS ---`);
    console.log(`Total Requests: ${CONCURRENCY}`);
    console.log(`Success: ${successes}`);
    console.log(`Errors/Timeouts: ${errors}`);
    console.log(`Total Elapsed Time: ${elapsed}ms`);
    console.log(`Average Latency: ${(totalTime / CONCURRENCY).toFixed(2)}ms`); // Very rough
    
    if (elapsed > 5000) {
        console.log(`❌ THRESHOLD BREACHED: Too slow under parallel pressure.`);
    } else {
        console.log(`✅ API Threader handled concurrency gracefully.`);
    }
};

RUN_API_LOAD_TEST().catch(console.error);
