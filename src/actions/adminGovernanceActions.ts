"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ProductStatus, CompanyStatus, CompanyType, AttributeType } from "@prisma/client";

async function ensureAdmin() {
    const session: any = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "SUPER_ADMIN")) {
        throw new Error("Unauthorized: Admin access required.");
    }
    return session;
}

// --- CATEGORY ACTIONS ---

export async function createCategoryAction(data: { name: string; parentId?: string; slug: string }) {
    await ensureAdmin();
    const category = await prisma.globalCategory.create({
        data: {
            name: data.name,
            parentId: data.parentId || null,
            slug: data.slug,
        }
    });
    revalidatePath("/admin/catalog/categories");
    return { success: true, category };
}

export async function updateCategoryAction(id: string, data: { name?: string; active?: boolean }) {
    await ensureAdmin();
    await prisma.globalCategory.update({
        where: { id },
        data
    });
    revalidatePath("/admin/catalog/categories");
    return { success: true };
}

export async function addCategoryAttributeAction(categoryId: string, data: { name: string; type: AttributeType; options?: string[] }) {
    await ensureAdmin();
    await prisma.categoryAttribute.create({
        data: {
            categoryId,
            name: data.name,
            type: data.type,
            options: data.options ? {
                create: data.options.map(val => ({ value: val }))
            } : undefined
        }
    });
    revalidatePath("/admin/catalog/categories");
    return { success: true };
}

// --- PRODUCT MODERATION ACTIONS ---

export async function approveProductAction(productId: string) {
    await ensureAdmin();
    await prisma.globalProduct.update({
        where: { id: productId },
        data: { status: ProductStatus.APPROVED, approvalNote: "Approved by Admin" }
    });
    revalidatePath("/admin/products");
    return { success: true };
}

export async function rejectProductAction(productId: string, note: string) {
    await ensureAdmin();
    await prisma.globalProduct.update({
        where: { id: productId },
        data: { status: ProductStatus.REJECTED, approvalNote: note }
    });
    revalidatePath("/admin/products");
    return { success: true };
}

// --- COMPANY MANAGEMENT ACTIONS ---

export async function updateCompanyStatusAction(companyId: string, status: CompanyStatus) {
    await ensureAdmin();
    await prisma.company.update({
        where: { id: companyId },
        data: { status }
    });
    revalidatePath("/admin/companies");
    return { success: true };
}

export async function updateCompanyTypeAction(companyId: string, type: CompanyType) {
    await ensureAdmin();
    await prisma.company.update({
        where: { id: companyId },
        data: { type }
    });
    revalidatePath("/admin/companies");
    return { success: true };
}
