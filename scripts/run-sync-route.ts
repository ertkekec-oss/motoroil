import { NextResponse } from 'next/server';
import { POST } from './src/app/api/integrations/marketplace/sync/route';

async function run() {
    const req = new Request('http://localhost:3000/api/integrations/marketplace/sync', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // provide any needed headers to bypass auth or use a test tenant
            'x-forwarded-for': '127.0.0.1'
        },
        body: JSON.stringify({ manualTrigger: true, testMode: true })
    });
    
    // Auth bypass inside route? 
    // Actually we can't easily bypass `authorize()` which depends on cookies.
}
run();
