const https = require('https');

https.get('https://api.nilvera.com/swagger/v1/swagger.json', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const json = JSON.parse(data);
        const paths = Object.keys(json.paths).filter(p => p.toLowerCase().includes('cancel') || p.toLowerCase().includes('iptal'));
        for (const p of paths) {
            console.log(p);
            console.log(JSON.stringify(json.paths[p], null, 2));
        }
    });
});
