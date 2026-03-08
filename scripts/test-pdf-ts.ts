import { GET } from '../src/app/api/portal/signatures/document/pdf/route';
import { NextRequest } from 'next/server';

async function main() {
    const req = new NextRequest('http://localhost:3000/api/portal/signatures/document/pdf?token=3cdfe20ddd5b702ca2c5cc1e0dc2bbb97466863b355e4c87737e161649a819f0', { method: 'GET' });
    const res = await GET(req as any);
    console.log("Status:", res.status);
    if (res.status === 200) {
        console.log(Array.from(res.headers.entries()));
    } else {
        console.log(await res.text());
    }
}
main().catch(console.error);
