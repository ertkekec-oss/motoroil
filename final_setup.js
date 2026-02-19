const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    try {
        const email = 'ertugrul.kekec@periodya.com';
        const password = '12385788';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('Final attempt to setup Super Admin (Robust version)...');

        // 1. Tenant
        let tenant = await prisma.tenant.findUnique({ where: { id: 'PLATFORM_ADMIN' } });
        if (!tenant) {
            tenant = await prisma.tenant.create({
                data: {
                    id: 'PLATFORM_ADMIN',
                    name: 'Periodya Platform Admin',
                    ownerEmail: 'support@periodya.com',
                    setupState: 'COMPLETED'
                }
            });
        }

        // 2. Company
        let company = await prisma.company.findFirst({
            where: { tenantId: 'PLATFORM_ADMIN', vkn: '0000000000' }
        });
        if (!company) {
            company = await prisma.company.create({
                data: {
                    tenantId: 'PLATFORM_ADMIN',
                    name: 'Periodya Yönetim',
                    vkn: '0000000000',
                    isDefault: true
                }
            });
        }

        // 3. User
        let user = await prisma.user.findUnique({ where: { email: email } });
        if (user) {
            user = await prisma.user.update({
                where: { email: email },
                data: {
                    password: hashedPassword,
                    role: 'SUPER_ADMIN',
                    tenantId: 'PLATFORM_ADMIN',
                    permissions: ['*']
                }
            });
        } else {
            user = await prisma.user.create({
                data: {
                    email: email,
                    name: 'Ertuğrul Keleş',
                    password: hashedPassword,
                    role: 'SUPER_ADMIN',
                    tenantId: 'PLATFORM_ADMIN',
                    permissions: ['*']
                }
            });
        }

        // 4. Staff
        let staff = await prisma.staff.findFirst({ where: { email: email } });
        if (staff) {
            await prisma.staff.update({
                where: { id: staff.id },
                data: {
                    password: hashedPassword,
                    role: 'ADMIN',
                    tenantId: 'PLATFORM_ADMIN'
                }
            });
        } else {
            await prisma.staff.create({
                data: {
                    id: 'superadmin_staff_id',
                    username: email,
                    email: email,
                    password: hashedPassword,
                    role: 'ADMIN',
                    name: 'Ertuğrul Keleş',
                    tenantId: 'PLATFORM_ADMIN',
                    branch: 'Merkez'
                }
            });
        }

        // 5. Access
        const access = await prisma.userCompanyAccess.findFirst({
            where: { userId: user.id, companyId: company.id }
        });
        if (!access) {
            await prisma.userCompanyAccess.create({
                data: {
                    userId: user.id,
                    companyId: company.id,
                    role: 'ADMIN'
                }
            });
        }

        console.log('SUCCESS: Super Admin fully provisioned.');
    } catch (err) {
        console.error('ERROR OCCURRED:');
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
