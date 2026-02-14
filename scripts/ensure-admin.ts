import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Ensuring ertugrul.kekec@periodya.com exists as Platform Admin...');

    const email = 'ertugrul.kekec@periodya.com';
    const rawPassword = '12385788'; // As requested by user
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        // Create Tenant if needed or use existing 'Kech'
        let tenant = await prisma.tenant.findFirst({ where: { name: 'Periodya' } });
        if (!tenant) {
            // Check if Kech exists and rename or create new? Let's create new or use default.
            tenant = await prisma.tenant.findFirst();
            if (!tenant) {
                tenant = await prisma.tenant.create({
                    data: {
                        name: 'Periodya',
                        ownerEmail: email,
                        status: 'ACTIVE'
                    }
                });
                console.log('Tenant Periodya created:', tenant.id);
            }
        }

        // Create Company if needed
        let company = await prisma.company.findFirst({ where: { tenantId: tenant.id } });
        if (!company) {
            company = await prisma.company.create({
                data: {
                    tenantId: tenant.id,
                    name: 'Periodya HQ',
                    vkn: '1111111111',
                    city: 'Istanbul'
                }
            });
            console.log('Company Periodya HQ created:', company.id);
        }

        user = await prisma.user.create({
            data: {
                email,
                password: passwordHash,
                name: 'Ertuğrul Kekeç',
                role: 'SUPER_ADMIN',
                tenantId: tenant.id
            }
        });

        // Grant access
        await prisma.userCompanyAccess.create({
            data: { userId: user.id, companyId: company.id, role: 'ADMIN' }
        });

        console.log(`User ${email} created successfully with new password.`);
    } else {
        console.log(`User ${email} already exists. Updating password and roles...`);

        // ALWAYS Reset Password to what user requested
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: passwordHash,
                role: 'SUPER_ADMIN'
            }
        });
        console.log('Password updated successfully.');

        // Ensure company access exists (fix for "unauthorized" if user exists but has no company link)
        const access = await prisma.userCompanyAccess.findFirst({ where: { userId: user.id } });
        if (!access) {
            const company = await prisma.company.findFirst();
            if (company) {
                await prisma.userCompanyAccess.create({
                    data: { userId: user.id, companyId: company.id, role: 'ADMIN' }
                });
                console.log('Company access restored for user.');
            }
        }
    }
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
