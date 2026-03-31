const fs = require('fs');
const file = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(/\) : \(\s*\{customer\.offers\.map/g, ') : customer.offers.map');
data = data.replace(/\) : \(\s*\{customer\.checks\.map/g, ') : customer.checks.map');
data = data.replace(/\) : \(\s*\{customer\.paymentPlans\.map/g, ') : customer.paymentPlans.map');
data = data.replace(/\) : \(\s*\{customer\.reconciliations\.map/g, ') : customer.reconciliations.map');

fs.writeFileSync(file, data);
console.log('Fixed ternary maps');
