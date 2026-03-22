const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function run() {
  const camps = await prisma.campaign.findMany({ where: { isActive: true }, select: { id: true, name: true, type: true, targetCustomerCategoryIds: true, campaignType: true, conditions: true, pointsRate: true, discountRate: true } })
  console.dir(camps, { depth: null })
  process.exit(0)
}
run()
