import prisma from "./src/lib/prisma"

async function main() {
    try {
        console.log("Checking products:")
        const p = await prisma.product.findFirst({
            select: { id: true, stock: true, reservedStock: true }
        })
        console.log(p)

        console.log("Checking dealerCartItem:")
        const x = await prisma.dealerCartItem.findFirst()
        console.log(x)

        console.log("Checking dealerCart:")
        const y = await prisma.dealerCart.findFirst()
        console.log(y)

        console.log("All OK!")
    } catch (e: any) {
        console.error("FAILLLLL:", e)
    } finally {
        await prisma.$disconnect()
    }
}
main()
