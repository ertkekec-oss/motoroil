const fs = require('fs');
const txt = fs.readFileSync('prisma/schema.prisma', 'utf8');
const start = txt.indexOf('\nmodel Order {');
const end = txt.indexOf('}', start);
fs.writeFileSync('temp_order_model.txt', txt.substring(start, end + 1));
