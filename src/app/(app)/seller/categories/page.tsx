import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CategoryMappingClient from "./CategoryMappingClient";

export const dynamic = "force-dynamic";

export default async function CategoryMappingPage() {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) {
        redirect("/login");
    }

    const companyId = user.companyId || session?.companyId;

    // 1. Auto-discover and materialize any dynamically typed categories from the Product table
    const distinctProductCats = await prisma.product.findMany({
        where: { companyId, deletedAt: null, category: { not: "" } },
        select: { category: true },
    });

    // Unique category names
    const uniqueCatNames = Array.from(new Set(distinctProductCats.map(p => p.category).filter(Boolean)));

    for (const catName of uniqueCatNames) {
        if (!catName || catName === "Diğer" || catName === "-") continue; // Skip fallbacks

        const existing = await prisma.eRPProductCategory.findFirst({
            where: { sellerCompanyId: companyId, name: catName }
        });
        
        if (!existing) {
            await prisma.eRPProductCategory.create({
                data: { sellerCompanyId: companyId, name: catName }
            });
        }
    }

    // 2. Fetch Global Categories
    const globalCategories = await prisma.globalCategory.findMany({
        orderBy: { name: 'asc' },
        include: {
            parent: {
                include: {
                    parent: true
                }
            }
        }
    });

    let localCategoriesRaw = await prisma.eRPProductCategory.findMany({
        where: { sellerCompanyId: companyId },
        include: { _count: { select: { mappings: true } }, mappings: { include: { globalCategory: true } } },
        orderBy: { name: 'asc' }
    });

    // Strategy: Only display legitimate ERP categories managed by the system
    const localCategories = localCategoriesRaw.map((c: any) => {
        // Find how many products have this category string for quick math
        const assignedProductsCount = distinctProductCats.filter(p => p.category === c.name).length;
        return {
            id: c.id,
            name: c.name,
            count: assignedProductsCount > 0 ? assignedProductsCount : (c._count?.mappings || 0), 
            globalCategory: c.mappings.length > 0 ? c.mappings[0].globalCategory : null
        }
    });

    const total = localCategories.length;
    const mapped = localCategories.filter((c: any) => c.globalCategory).length;
    const pending = total - mapped;

    return (
        <CategoryMappingClient 
            localCategories={localCategories}
            globalCategories={globalCategories}
            mappingStats={{ total, mapped, pending }}
        />
    );
}
