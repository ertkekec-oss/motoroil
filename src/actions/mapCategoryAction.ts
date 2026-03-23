"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function mapCategoryAction(localCategoryName: string, globalCategoryId: string) {
    try {
        const session: any = await getSession();
        const user = session?.user || session;

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const companyId = user.companyId || session?.companyId;
        if (!companyId) {
            return { success: false, error: "Company ID missing" };
        }

        // Check if ERPProductCategory exists for this name, if not create it
        let erpCategory = await prisma.eRPProductCategory.findFirst({
            where: { sellerCompanyId: companyId, name: localCategoryName }
        });

        if (!erpCategory) {
            erpCategory = await prisma.eRPProductCategory.create({
                data: {
                    sellerCompanyId: companyId,
                    name: localCategoryName
                }
            });
        }

        // Check if mapping exists
        const existingMap = await prisma.categoryMapping.findFirst({
            where: {
                erpCategory: { id: erpCategory.id },
                globalCategory: { id: globalCategoryId }
            }
        });

        if (!existingMap) {
            // Delete any existing mappings for this local category to ensure 1-to-1 sync
            // Assuming erpCategory deleteMany relies on the same object structure if scalar isn't present
            // Wait, deleteMany usually works differently. We can filter by the relation.
            const oldMappings = await prisma.categoryMapping.findMany({
                where: { erpCategory: { id: erpCategory.id } }
            });
            for (const old of oldMappings) {
                await prisma.categoryMapping.delete({ where: { id: old.id } });
            }

            await prisma.categoryMapping.create({
                data: {
                    erpCategoryId: erpCategory.id,
                    globalCategoryId: globalCategoryId,
                    companyId: companyId
                }
            });
        }

        revalidatePath("/seller/categories");
        revalidatePath("/catalog");
        
        return { success: true };
    } catch (e: any) {
        console.error("mapCategoryAction ERROR: ", e);
        return { success: false, error: e.message || "Eşleştirme sırasında kritik bir hata oluştu." };
    }
}
