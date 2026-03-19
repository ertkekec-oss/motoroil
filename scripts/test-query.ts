import { prismaRaw } from "../src/lib/prisma"

async function run() {
    const events = await prismaRaw.auditEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 10
    })
    console.log(JSON.stringify(events, null, 2))
}

run().catch(console.error).finally(() => process.exit(0))
