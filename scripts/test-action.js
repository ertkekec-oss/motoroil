const req = {
    method: 'POST',
    json: async () => ({
        token: '13c8edbe3cf360bc08721c6e52fe0d79c142f809f4c7e6aa042351c4ed91fa29', // I will use the one from screenshot
        action: 'SIGNED'
    }),
    headers: {
        get: () => 'unknown'
    }
};

const route = require('./src/app/api/portal/signatures/action/route');

async function main() {
    const res = await route.POST(req);
    console.log(res.status, await res.json());
}

main().catch(console.error);
