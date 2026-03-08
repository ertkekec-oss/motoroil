const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const test = await prisma.appSettings.create({
            data: {
                key: 'test_setting_2',
                value: { hello: 'world' }
            }
        });
        console.log(test);
        await prisma.appSettings.delete({ where: { id: test.id } });
    } catch (e) {
        console.error(e);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
