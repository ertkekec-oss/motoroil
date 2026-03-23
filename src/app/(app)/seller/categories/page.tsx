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

    let localCategoriesRaw = await prisma.eRPProductCategory.findMany({
        where: { sellerCompanyId: companyId },
        include: { _count: { select: { mappings: true } }, mappings: { include: { globalCategory: true } } },
        orderBy: { name: 'asc' }
    });

    // Strategy: Only display legitimate ERP categories managed by the system
    const localCategories = localCategoriesRaw.map((c: any) => ({
        id: c.id,
        name: c.name,
        count: c._count?.mappings || 0, // Quick fallback
        globalCategory: c.mappings.length > 0 ? c.mappings[0].globalCategory : null
    }));

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
