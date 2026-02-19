import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const KEY_TO_DISPLAY = {
    trendyol: "Trendyol",
    hepsiburada: "Hepsiburada",
    n11: "N11",
    pazarama: "Pazarama",
    amazon: "Amazon",
    pos: "POS",
    POS: "POS",
};

const VARIANT_TO_DISPLAY = {
    Trendyol: "Trendyol",
    TRENDYOL: "Trendyol",
    trendyol: "Trendyol",
    Hepsiburada: "Hepsiburada",
    HEPSIBURADA: "Hepsiburada",
    hepsiburada: "Hepsiburada",
    N11: "N11",
    n11: "N11",
    N11e: "N11",
    "N11 ": "N11",
    Pazarama: "Pazarama",
    PAZARAMA: "Pazarama",
    pazarama: "Pazarama",
    Amazon: "Amazon",
    AMAZON: "Amazon",
    amazon: "Amazon",
    POS: "POS",
    pos: "POS",
};

function toCanonicalDisplay(mp) {
    if (mp == null) return null;
    const raw = String(mp).trim();
    if (!raw) return null;
    const direct = VARIANT_TO_DISPLAY[raw];
    if (direct) return direct;
    const key = raw.toLowerCase();
    const fromKey = KEY_TO_DISPLAY[key];
    if (fromKey) return fromKey;
    if (raw.toUpperCase() === "POS") return "POS";
    return raw;
}

async function main() {
    const before = await prisma.order.groupBy({
        by: ["marketplace"],
        _count: { _all: true },
    });

    console.log("Before:");
    for (const g of before) console.log(`- ${g.marketplace}: ${g._count._all}`);

    let updatedTotal = 0;
    for (const g of before) {
        const current = g.marketplace;
        if (!current) continue;
        const canonical = toCanonicalDisplay(current);
        if (!canonical || canonical === current) continue;

        const res = await prisma.order.updateMany({
            where: { marketplace: current },
            data: { marketplace: canonical },
        });
        updatedTotal += res.count;
        console.log(`Updated ${res.count} rows: "${current}" -> "${canonical}"`);
    }

    const after = await prisma.order.groupBy({
        by: ["marketplace"],
        _count: { _all: true },
    });

    console.log("\nAfter:");
    for (const g of after) console.log(`- ${g.marketplace}: ${g._count._all}`);
    console.log(`\nDone. Total updated rows: ${updatedTotal}`);
}

main()
    .catch((e) => {
        console.error("Normalize failed:", e);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
