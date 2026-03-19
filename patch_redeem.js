const fs = require('fs');

const route_path = 'src/app/api/network/invites/redeem/route.ts';
let content = fs.readFileSync(route_path, 'utf8');

const oldCode = `                const existingCustomer = await tx.customer.findFirst({
                    where: { 
                        companyId: supplierCompany.id,
                        OR: [
                            { taxNumber: taxNumber },
                            { phone: phoneE164 }
                        ]
                    },
                    select: { id: true }
                })`;

const newCode = `                const existingCustomer = await tx.customer.findFirst({
                    where: { 
                        companyId: supplierCompany.id,
                        OR: [
                            { taxNumber: taxNumber },
                            { phone: phoneE164 },
                            ...(email ? [{ email: email }] : [])
                        ]
                    },
                    select: { id: true }
                })`;

content = content.replace(oldCode, newCode);

fs.writeFileSync(route_path, content, 'utf8');
console.log('Done!');
