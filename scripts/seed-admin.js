const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function fixAdmin() {
    // Get or create tenant
    let tenant = await prisma.tenant.findFirst();

    if (!tenant) {
        console.log('Creating tenant...');
        tenant = await prisma.tenant.create({
            data: {
                email: 'admin@motoroil.com',
                name: 'Motor Yağı Hizmetleri',
                phone: '5551234567'
            }
        });
    }

    // Get or create company
    let company = await prisma.company.findFirst({ where: { tenantId: tenant.id } });

    if (!company) {
        console.log('Creating company...');
        company = await prisma.company.create({
            data: {
                tenantId: tenant.id,
                name: 'Motor Yağı Hizmetleri',
                taxNumber: '1234567890',
                phone: '5551234567',
                address: 'Merkez Mahallesi',
                city: 'İstanbul',
                country: 'Türkiye'
            }
        });
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@motoroil.com' },
        update: {
            password: hashedPassword,
            role: 'ADMIN'
        },
        create: {
            tenantId: tenant.id,
            email: 'admin@motoroil.com',
            name: 'Sistem Yöneticisi',
            password: hashedPassword,
            role: 'ADMIN'
        }
    });

    // Grant company access
    await prisma.userCompanyAccess.upsert({
        where: {
            userId_companyId: {
                userId: admin.id,
                companyId: company.id
            }
        },
        update: {
            role: 'COMPANY_ADMIN'
        },
        create: {
            userId: admin.id,
            companyId: company.id,
            role: 'COMPANY_ADMIN'
        }
    });

    console.log('✅ Admin user ready!');
    console.log('Email: admin@motoroil.com');
    console.log('Password: admin123');
    console.log('Tenant:', tenant.name);
    console.log('Company:', company.name);

    await prisma.$disconnect();
}

fixAdmin().catch(console.error);
