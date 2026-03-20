const fs = require('fs');
const file_path = 'src/app/api/network/invites/redeem/route.ts';
let content = fs.readFileSync(file_path, 'utf8');

const oldFind = `                const existingCustomer = orConditions.length > 0 ? await tx.customer.findFirst({
                    where: { 
                        companyId: supplierCompany.id,
                        OR: orConditions
                    },
                    select: { id: true }
                }) : null;
                if (!existingCustomer) {`;

const newFind = `                const existingCustomer = orConditions.length > 0 ? await tx.customer.findFirst({
                    where: { 
                        companyId: supplierCompany.id,
                        OR: orConditions
                    },
                    select: { id: true, deletedAt: true }
                }) : null;

                if (existingCustomer) {
                    // Müşteri silinmişse (soft-delete), onu geri yükle (restore)
                    if (existingCustomer.deletedAt) {
                        await tx.customer.update({
                            where: { id: existingCustomer.id },
                            data: {
                                deletedAt: null,
                                supplierClass: "B2B_DEALER",
                                customerClass: "B2B_BAYI",
                            }
                        });
                    }
                } else {`;

if (content.includes(oldFind)) {
    content = content.replace(oldFind, newFind);
    fs.writeFileSync(file_path, content, 'utf8');
    console.log('Done mapping restore logic.');
} else {
    console.log('Failed to match old string.');
}
