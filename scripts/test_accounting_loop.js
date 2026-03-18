const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testLoop() {
    let groupCode = '108.01';
    let nextSeq = 1;
    let kasaId = 'testkasaid';
    let companyId = 'testcompanyid'; // Needs real companyId to actually check
    let branch = 'KAYSERİ NAKİT';

    const kasalar = await prisma.kasa.findFirst({
        where: { name: { contains: 'KAYSERİ Nakit' } }
    });
    if (!kasalar) {
        console.log('Kasa not found');
        return;
    }
    companyId = kasalar.companyId;
    branch = kasalar.branch;
    kasaId = kasalar.id;
    groupCode = '100.01';

    console.log(`Testing Kasa: ${kasaId}, Company: ${companyId}, Branch: ${branch}`);

    // RUN THE EXACT LOGIC AS accounting.ts
    let accountToReturn = null;
    let iterations = 0;

    let groupAccount = await prisma.account.findFirst({
        where: { code: groupCode, branch, companyId }
    });
    if (!groupAccount) {
        console.log('Group account not found, assuming it will be created.');
    }

    while (!accountToReturn && iterations < 50) {
        iterations++;
        const lastChild = await prisma.account.findFirst({
            where: { parentCode: groupCode, branch, companyId },
            orderBy: { code: 'desc' }
        });

        if (lastChild) {
            const parts = lastChild.code.split('.');
            const lastNum = parseInt(parts[parts.length - 1]);
            if (!isNaN(lastNum)) nextSeq = Math.max(nextSeq, lastNum + 1);
        }

        const newCode = `${groupCode}.${nextSeq.toString().padStart(3, '0')}`;
        console.log(`Iteration ${iterations}, newCode: ${newCode}, nextSeq: ${nextSeq}`);

        const duplicate = await prisma.account.findFirst({
            where: { code: newCode, branch, companyId }
        });

        if (duplicate) {
            if (duplicate.kasaId === kasaId) {
                console.log('Found exact match!');
                accountToReturn = duplicate;
            } else if (!duplicate.kasaId) {
                console.log('Found empty match, mapping!');
                accountToReturn = duplicate;
            } else {
                console.log(`Conflict! Duplicate kasaId : ${duplicate.kasaId} vs ours: ${kasaId}`);
                nextSeq++; // Try next
            }
        } else {
             console.log(`Does not exist, we would create it! Loop ends.`);
             accountToReturn = { code: newCode };
        }
    }
}
testLoop().finally(() => prisma.$disconnect());
