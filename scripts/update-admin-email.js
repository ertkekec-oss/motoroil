const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

p.staff.update({
    where: { username: 'admin' },
    data: { email: 'admin@motoroil.com', status: 'Aktif' }
}).then(() => {
    console.log('✅ Email and status updated');
    p.$disconnect();
}).catch(e => {
    console.error(e);
    p.$disconnect();
});
