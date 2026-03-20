const fs = require('fs');
const file_path = 'src/app/api/network/invites/redeem/route.ts';
let content = fs.readFileSync(file_path, 'utf8');

// Replace the findFirst OR condition
const oldFind = `                const existingCustomer = await tx.customer.findFirst({
                    where: { 
                        companyId: supplierCompany.id,
                        OR: [
                            { taxNumber: taxNumber },
                            { phone: phoneE164 }
                        ]
                    },
                    select: { id: true }
                })`;

const newFind = `                // Fix: Sadece Vergi No ve E-Posta ile eşleştir (Telefon tekil değil, aynı bayi patronu farklı şirket için aynı telefonu kullanabilir)
                const orConditions: any[] = [];
                if (taxNumber) orConditions.push({ taxNumber });
                if (email) orConditions.push({ email });

                const existingCustomer = orConditions.length > 0 ? await tx.customer.findFirst({
                    where: { 
                        companyId: supplierCompany.id,
                        OR: orConditions
                    },
                    select: { id: true }
                }) : null;`;

content = content.replace(oldFind, newFind);

fs.writeFileSync(file_path, content, 'utf8');
console.log('Done patching existingCustomer query.');
