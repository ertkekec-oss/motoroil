import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Ensuring admin@kech.tr exists...');

    const email = 'admin@kech.tr';
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        // Create Tenant if needed
        let tenant = await prisma.tenant.findFirst({ where: { name: 'Kech' } });
        if (!tenant) {
            tenant = await prisma.tenant.create({
                data: {
                    name: 'Kech',
                    ownerEmail: email,
                    status: 'ACTIVE'
                }
            });
            console.log('Tenant Kech created:', tenant.id);
        }

        // Create Company if needed
        let company = await prisma.company.findFirst({ where: { tenantId: tenant.id } });
        if (!company) {
            company = await prisma.company.create({
                data: {
                    tenantId: tenant.id,
                    name: 'Kech Ops',
                    vkn: '1111111111',
                    city: 'Istanbul'
                }
            });
            console.log('Company Kech Ops created:', company.id);
        }

        const password = await bcrypt.hash('admin1234', 10);
        user = await prisma.user.create({
            data: {
                email,
                password,
                name: 'System Admin',
                role: 'ADMIN',
                tenantId: tenant.id
            }
        });

        // Grant access
        await prisma.userCompanyAccess.create({
            data: { userId: user.id, companyId: company.id, role: 'ADMIN' }
        });

        console.log('User admin@kech.tr created successfully.');
    } else {
        console.log('User admin@kech.tr already exists.');
    }
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
