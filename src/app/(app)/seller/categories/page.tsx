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

    // Fetch Global Categories
    const globalCategories = await prisma.globalCategory.findMany({
        orderBy: { name: 'asc' },
    });

    // Strategy: First try ERPProductCategory, if empty, compute from Products and seed them or just pass as generic 
    let localCategories = await prisma.eRPProductCategory.findMany({
        where: { sellerCompanyId: companyId },
        include: { _count: { select: { mappings: true } }, mappings: { include: { globalCategory: true } } },
        orderBy: { name: 'asc' }
    });

    // If no ERPProductCategory exists, let's group by Product.category to auto-discover
    if (localCategories.length === 0) {
        const productCategories = await prisma.product.groupBy({
            by: ['category'],
            where: { companyId },
            _count: { id: true },
        });

        // Filter out those with no category name
        const discovered = productCategories.filter(pc => pc.category && pc.category.trim() !== "");
        
        // We will just pass these as mock ERPProductCategory for the UI 
        // In a real app, we'd auto-seed the ERPProductCategory table here.
        localCategories = discovered.map(pc => ({
            id: pc.category,
            name: pc.category,
            count: pc._count.id,
            mappings: [],
            globalCategory: null
        })) as any;
    } else {
        // format localCategories
        localCategories = localCategories.map((c: any) => ({
            id: c.id,
            name: c.name,
            count: c._count?.mappings || 0, // Should be product count ideally, but keeping it simple
            globalCategory: c.mappings.length > 0 ? c.mappings[0].globalCategory : null
        })) as any;
    }

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
