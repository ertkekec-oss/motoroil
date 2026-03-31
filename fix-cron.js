const fs = require('fs');
let c = fs.readFileSync('src/app/api/cron/marketplaces/settlement-sync/route.ts', 'utf8');
c = c.replace(/\\`/g, '`').replace(/\\\$/g, '$');
fs.writeFileSync('src/app/api/cron/marketplaces/settlement-sync/route.ts', c);
