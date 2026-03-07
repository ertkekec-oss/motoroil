import { POST } from '../src/app/api/admin/network/market-signals/recompute/route';
import { NextRequest } from 'next/server';
import * as auth from '../src/lib/auth';

(auth as any).getSession = async () => ({ id: 'mock', role: 'PLATFORM_ADMIN' });

async function testRecompute() {
    console.log("=== RECOMPUTE DISPATCH TEST ===");

    const req1 = new NextRequest('http://localhost:3000/api/admin/network/market-signals/recompute', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            actionType: 'RECOMPUTE_MARKET_SIGNALS',
            categoryId: 'cat-recompute-test'
        })
    });

    const res1 = await POST(req1);
    const json1 = await res1.json();
    console.log(`Recompute Signals Response: ${res1.status}`, json1);
    if (res1.status !== 202) throw new Error("Expected 202 Async Accepted");

    const req2 = new NextRequest('http://localhost:3000/api/admin/network/market-signals/recompute', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            actionType: 'GENERATE_TENANT_MARKET_INSIGHTS',
            tenantId: 'tenant-test-123'
        })
    });

    const res2 = await POST(req2);
    const json2 = await res2.json();
    console.log(`Recompute Insights Response: ${res2.status}`, json2);
    if (res2.status !== 202) throw new Error("Expected 202 Async Accepted");

    console.log("✓ Async queue dispatches successfully");
    console.log("SUCCESS");
    process.exit(0);
}

testRecompute().catch((err) => {
    console.error(err);
    process.exit(1);
});
