// Create Admin User
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        console.log('🔧 Creating admin user...\n');

        // Hash password
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Create admin user
        const admin = await prisma.staff.create({
            data: {
                username: 'admin',
                password: hashedPassword,
                email: 'admin@motoroil.com',
                name: 'Admin',
                role: 'Admin',
                branch: 'Merkez',
                type: 'admin',
                status: 'Aktif',
                permissions: ['ALL'],
                performance: 100
            }
        });

        console.log('✅ Admin user created successfully!');
        console.log('\n📋 Login Credentials:');
        console.log('   Username: admin');
        console.log('   Password: admin123');
        console.log(`\n   User ID: ${admin.id}`);
        console.log(`   Role: ${admin.role}`);
        console.log(`   Branch: ${admin.branch}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
