const fs = require('fs');

const file_path = 'src/app/api/dealer-network/orders/approvals/route.ts';
let content = fs.readFileSync(file_path, 'utf8');

content = content.replace(
    'dealerUser: { select: { name: true, email: true } }',
    'dealerUser: { select: { phone: true, email: true } }'
);

fs.writeFileSync(file_path, content, 'utf8');
console.log('Fixed approvals query.');
