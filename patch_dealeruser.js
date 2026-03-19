const fs = require('fs');

const route_path = 'src/app/api/network/invites/redeem/route.ts';
let content = fs.readFileSync(route_path, 'utf8');

const oldCodeUser = `            // 3. Resolve DealerUser (invite-only logic)
            const existingUser = await tx.dealerUser.findFirst({
                where: { phone: phoneE164 },
                select: { id: true, defaultDealerCompanyId: true, passwordHash: true },
            })`;

const newCodeUser = `            // 3. Resolve DealerUser (invite-only logic)
            const existingUser = await tx.dealerUser.findFirst({
                where: { 
                    OR: [
                        { phone: phoneE164 },
                        ...(email ? [{ email }] : [])
                    ]
                },
                select: { id: true, defaultDealerCompanyId: true, passwordHash: true },
            })`;

content = content.replace(oldCodeUser, newCodeUser);
fs.writeFileSync(route_path, content, 'utf8');
console.log('Done DealerUser patch!');
