const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
db.salesInvoice.findFirst({where: {isFormal: true}, orderBy: {createdAt: 'desc'}}).then(i => { console.log("Recent FormalID:", i.formalId, "Type:", i.formalType, "UUID:", i.formalUuid); db.$disconnect() });
