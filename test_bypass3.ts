import { PrismaClient } from "@prisma/client";
import prisma from "./src/lib/prisma";

async function main() {
    try {
        console.log("Mocking...");
        const p = await prisma.product.findFirst({
            where: { id: "test" },
            adminBypass: true,
        } as any);
        console.log("Did it throw?", p);
    } catch (e: any) {
        console.error("Test Error:", e.message);
    }
}
main().finally(() => process.exit(0));
