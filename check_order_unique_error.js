const fs = require('fs');
const path = require('path');

async function testWithPrisma() {
    try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        console.log("Testing raw PrismaClient findUnique...");
        const result = await prisma.order.findUnique({
            where: {
                id: 'cmmy15zss0004mrsjls79ar5t',
                dealerMembershipId: 'cmmy15zss0004mrsjls79ar5t', // fake
                salesChannel: 'DEALER_B2B'
            }
        });
        console.log("findUnique result:", result);
    } catch(e) {
        console.log("findUnique error:", e.message);
    }

    try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        console.log("Testing raw PrismaClient findFirst...");
        const result = await prisma.order.findFirst({
            where: {
                id: 'cmmy15zss0004mrsjls79ar5t',
                dealerMembershipId: 'cmmy15zss0004mrsjls79ar5t', // fake
                salesChannel: 'DEALER_B2B'
            }
        });
        console.log("findFirst result:", result);
    } catch(e) {
        console.log("findFirst error:", e.message);
    }
}
testWithPrisma();
