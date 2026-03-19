import { PrismaClient } from "@prisma/client";
import prisma from "./src/lib/prisma";

async function main() {
    try {
        console.log("Testing findFirst with adminBypass...");
        const p = await prisma.product.findFirst({
            where: { id: "test" },
            adminBypass: true,
        } as any);
        console.log("Success findFirst!", p);
    } catch (e: any) {
        console.error("Test Error:", e.message);
    }
}
main().finally(() => process.exit(0));
