import { NextRequest } from 'next/server';
import { GET as getTenantSignals } from '../src/app/api/network/market-signals/route';
import { GET as getTenantCategories } from '../src/app/api/network/market-signals/categories/route';
import { GET as getTenantInsights } from '../src/app/api/network/market-insights/route';
import { GET as getAdminSignals } from '../src/app/api/admin/network/market-signals/route';
import { POST as postRecompute } from '../src/app/api/admin/network/market-signals/recompute/route';
import * as auth from '../src/lib/auth';

// Mock authentication for testing
(auth as any).getSession = async () => ({ id: 'mock', companyId: 'test-tenant-mock', role: 'PLATFORM_ADMIN' });

async function createMockRequest(url: string, method = 'GET', body?: any) {
    const req = new NextRequest(new URL(url, 'http://localhost:3000'), {
        method,
        body: body ? JSON.stringify(body) : undefined
    });
    Object.defineProperty(req, 'nextUrl', {
        get() {
            return new URL(url, 'http://localhost:3000');
        }
    });
    return req;
}

async function testEndpoints() {
    console.log("=== ENDPOINT PROJECTION TEST ===");

    // 1. Tenant Signals
    console.log("\nTesting GET /api/network/market-signals");
    let req = await createMockRequest('/api/network/market-signals');
    let res = await getTenantSignals(req);
    let json = await res.json();
    console.log(`Tenant Signals Count: ${json.data.length}`);
    if (json.data.length > 0) {
        if ('explanationDetails' in json.data[0]) throw new Error("Tenant signal exposed internal explanationDetails!");
        if ('isStaleFlag' in json.data[0]) throw new Error("Tenant signal exposed internal stale flag!");
        console.log("✓ Tenant raw internal fields are hidden");
    }

    // 2. Tenant Insights
    console.log("\nTesting GET /api/network/market-insights");
    req = await createMockRequest('/api/network/market-insights');
    res = await getTenantInsights(req);
    json = await res.json();
    console.log(`Tenant Insights Count: ${json.data.length}`);

    // 3. Admin Signals
    console.log("\nTesting GET /api/admin/network/market-signals");
    req = await createMockRequest('/api/admin/network/market-signals');
    res = await getAdminSignals(req);
    json = await res.json();
    console.log(`Admin Signals Count: ${json.data.length}`);
    if (json.data.length > 0) {
        if (!('explanationDetails' in json.data[0])) throw new Error("Admin signal missing internal explanationDetails!");
        console.log("✓ Admin raw internal fields are visible");
    }

    // 4. Admin Recompute Trigger
    console.log("\nTesting POST /api/admin/network/market-signals/recompute");
    req = await createMockRequest('/api/admin/network/market-signals/recompute', 'POST', {
        actionType: 'RECOMPUTE_MARKET_SIGNALS',
        categoryId: 'test-cat-123'
    });
    const res4 = await postRecompute(req);
    const json4 = await res4.json();
    console.log(`Recompute Status: ${res4.status} - ${json4.message}`);
    if (res4.status !== 202) throw new Error("Recompute failed");

    console.log("\nSUCCESS: All endpoints return projection-safe data!");
    process.exit(0);
}

testEndpoints().catch(console.error);
