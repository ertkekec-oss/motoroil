const req = {
    method: 'GET',
    url: 'http://localhost:3000/api/portal/signatures/document/pdf?token=3cdfe20ddd5b702ca2c5cc1e0dc2bbb97466863b355e4c87737e161649a819f0',
};

const route = require('./src/app/api/portal/signatures/document/pdf/route');
const { NextRequest } = require('next/server');

async function main() {
    const nextReq = new NextRequest(req.url, { method: 'GET' });
    const res = await route.GET(nextReq);
    console.log("Status:", res.status);
    if (res.status !== 200) {
        console.log("Error body:", await res.text());
    } else {
        console.log("HEADERS:", Array.from(res.headers.entries()));
        // Try reading stream
        if (res.body) {
            console.log("Body exists, web stream?", typeof res.body.getReader);
        }
    }
}

main().catch(console.error);
