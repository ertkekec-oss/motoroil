import { apiResponse, apiError } from "@/lib/api-context";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const transfers = await prisma.stockTransfer.findMany({
            take: 50,
            orderBy: { createdAt: "desc" },
        });

        return apiResponse({ transfers: transfers ?? [] });
    } catch (err) {
        console.error("inventory/transfer failed", err);

        return apiError({
            message: "Stock transfer fetch failed",
            code: "INVENTORY_TRANSFER_FAILED",
            status: 500,
            details: String(err)
        });
    }
}
