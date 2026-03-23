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
                erpCategoryId: erpCategory.id,
                globalCategoryId: globalCategoryId
            }
        });

        if (!existingMap) {
            // Delete any existing mappings for this local category to ensure 1-to-1 sync
            await prisma.categoryMapping.deleteMany({
                where: { erpCategoryId: erpCategory.id }
            });

            await prisma.categoryMapping.create({
                data: {
                    erpCategoryId: erpCategory.id,
                    globalCategoryId: globalCategoryId
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
