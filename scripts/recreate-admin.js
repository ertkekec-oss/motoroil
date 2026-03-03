const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'ertugrul.kekec@periodya.com';
    const password = '123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Find any tenant to associate with, preferably PLATFORM_ADMIN if it exists
    let tenant = await prisma.tenant.findFirst({
        where: { id: 'PLATFORM_ADMIN' }
    });

    if (!tenant) {
        tenant = await prisma.tenant.findFirst();
    }

    if (!tenant) {
        tenant = await prisma.tenant.create({
            data: {
                id: 'PLATFORM_ADMIN',
                name: 'System Admin',
                ownerEmail: email,
                status: 'ACTIVE'
            }
        });
        console.log('Created tenant', tenant.id);
    }

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            permissions: ["pos_access", "finance_view", "customer_view", "supplier_view", "inventory_view", "service_view", "sales_archive", "field_sales_access", "field_sales_admin", "offer_create", "reports_view", "settings_manage", "staff_manage", "audit_view", "security_access"],
        },
        create: {
            email,
            name: 'Ertuğrul Kekeç',
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            tenantId: tenant.id,
            permissions: ["pos_access", "finance_view", "customer_view", "supplier_view", "inventory_view", "service_view", "sales_archive", "field_sales_access", "field_sales_admin", "offer_create", "reports_view", "settings_manage", "staff_manage", "audit_view", "security_access"],
        }
    });

    console.log('User restored/updated:', user.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
