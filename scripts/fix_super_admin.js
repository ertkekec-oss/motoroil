const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function fixSuperAdmin() {
    const email = 'ertugrul.kekec@periodya.com';
    let user = await prisma.user.findUnique({ where: { email } });
    
    // Check if there is a 'PLATFORM_TENANT' or pick the first tenant
    let adminTenant = await prisma.tenant.findUnique({ where: { id: 'PLATFORM_TENANT' }});
    if (!adminTenant) {
        adminTenant = await prisma.tenant.findFirst({
            where: { status: 'ACTIVE' },
            orderBy: { createdAt: 'asc' }
        });
    }

    if (user) {
        console.log("User found, upgrading to SUPER_ADMIN:");
        const hash = await bcrypt.hash('123456', 10);
        await prisma.user.update({
            where: { id: user.id },
            data: { 
                 password: hash, 
                 role: 'SUPER_ADMIN'
            }
        });
        console.log("Password reset to: 123456");
    } else {
        console.log("User not found under that email. Generating a fresh SUPER_ADMIN account...");
        
        let tenantId = 'PLATFORM_TENANT';
        if (adminTenant) tenantId = adminTenant.id;

        const hash = await bcrypt.hash('123456', 10);
        await prisma.user.create({
            data: {
                email,
                name: "Ertugrul Kekec",
                password: hash,
                role: 'SUPER_ADMIN',
                tenantId: tenantId
            }
        });
        console.log("A brand new SUPER_ADMIN user has been created with password: 123456");
    }
}

fixSuperAdmin().catch(console.error).finally(() => prisma.$disconnect());
