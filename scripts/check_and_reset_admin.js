const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function checkAdmin() {
    const email = 'ertugrul.kekec@periodya.com';
    let user = await prisma.user.findUnique({ where: { email } });
    
    if (user) {
        console.log("User found:");
        console.log({ id: user.id, email: user.email, role: user.role, isActive: user.isActive });
        
        // Let's reset the password to 123456
        const hash = await bcrypt.hash('123456', 10);
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hash, isPlatformAdmin: true, role: 'SUPER_ADMIN', isActive: true }
        });
        console.log("Password reset to: 123456");
        console.log("Admin privileges restored.");
    } else {
        console.log("User not found under that email.");
    }
}

checkAdmin().catch(console.error).finally(() => prisma.$disconnect());
