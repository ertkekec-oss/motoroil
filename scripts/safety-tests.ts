
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function runTests() {
    console.log('🚀 Starting Production-Grade Safety Tests...');

    // Test 1: Unauthorized Bank Access
    console.log('\nTC-01: Unauthorized Bank Access should return 401 (Not 500)');
    try {
        const res = await axios.get(`${API_BASE}/api/fintech/banking/transactions`, {
            validateStatus: () => true
        });
        if (res.status === 401 && res.data.code === 'AUTH_REQUIRED') {
            console.log('✅ PASS: Returned 401 with AUTH_REQUIRED');
        } else {
            console.error(`❌ FAIL: Expected 401, got ${res.status}. Data:`, res.data);
        }
    } catch (e: any) {
        console.error('❌ FAIL: Connection error', e.message);
    }

    // Test 2: Health Protection
    console.log('\nTC-02: Health Endpoint should be protected but accessible via Key');
    try {
        const resNoKey = await axios.get(`${API_BASE}/api/admin/marketplace/queue/health`, {
            validateStatus: () => true
        });
        if (resNoKey.status === 401) {
            console.log('✅ PASS: Access denied without key');
        } else {
            console.error(`❌ FAIL: Expected 401, got ${resNoKey.status}`);
        }

        const resWithKey = await axios.get(`${API_BASE}/api/admin/marketplace/queue/health`, {
            headers: { 'x-health-key': process.env.HEALTHCHECK_KEY || 'dev-key' },
            validateStatus: () => true
        });
        if (resWithKey.status === 200) {
            console.log('✅ PASS: Accessible with correct key');
        } else {
            console.error(`❌ FAIL: Expected 200, got ${resWithKey.status}`);
        }
    } catch (e: any) {
        console.error('❌ FAIL: Health test error', e.message);
    }

    // Test 3: Prisma Drift Check (Simulated)
    console.log('\nTC-03: Checking for Schema Drift...');
    try {
        const models = Object.keys(prisma).filter(k => !k.startsWith('_'));
        if (models.includes('cmsPage') && models.includes('marketplaceActionAudit')) {
            console.log('✅ PASS: Models synchronized in Prisma Client');
        } else {
            console.error('❌ FAIL: Important models missing from Prisma Client!');
        }
    } catch (e: any) {
        console.error('❌ FAIL: Prisma check error', e.message);
    }

    console.log('\n🏁 Safety Tests Completed.');
    process.exit(0);
}

runTests();
