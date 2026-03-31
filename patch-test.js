const fs = require('fs');
let c = fs.readFileSync('scripts/test-settlement-sync.ts', 'utf8');
c = c.replace(/where: \{ marketplace: \{ in: \['trendyol', 'Trendyol'\] \} \}/g, "where: { marketplace: { in: ['trendyol', 'Trendyol'] }, status: { in: ['Teslim Edildi', 'Delivered'] } }");
c = c.replace(/where: \{ marketplace: \{ in: \['hepsiburada', 'Hepsiburada'\] \} \}/g, "where: { marketplace: { in: ['hepsiburada', 'Hepsiburada'] }, status: { in: ['Teslim Edildi', 'Delivered'] } }");
c = c.replace(/where: \{ marketplace: \{ in: \['n11', 'N11'\] \} \}/g, "where: { marketplace: { in: ['n11', 'N11'] }, status: { in: ['Teslim Edildi', 'Delivered'] } }");
c = c.replace(/orderBy: \{ orderDate: 'desc' \}/g, "orderBy: { orderDate: 'asc' }");
fs.writeFileSync('scripts/test-settlement-sync.ts', c);
