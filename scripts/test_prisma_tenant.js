const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        await prisma.tenant.create({
            data: { id: "test-err-id", name: "test-err-name" }
        });
        console.log("Success");
    } catch (e) {
        console.log(e.message);
    }
}
run();
