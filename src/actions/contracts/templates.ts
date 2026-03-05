"use server";

import { prisma } from '@/lib/prisma';
import { getStrictTenantId } from '@/services/contracts/tenantContext';
import { TemplateEngine } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function createTemplate(data: { name: string; description?: string; engine: TemplateEngine; bodyContent: string }) {
    const tenantId = await getStrictTenantId();

    // Create Template and its first Version in a transaction
    const template = await prisma.$transaction(async (tx) => {
        const t = await tx.documentTemplate.create({
            data: {
                tenantId,
                name: data.name,
                description: data.description,
                engine: data.engine,
                status: 'DRAFT'
            }
        });

        await tx.templateVersion.create({
            data: {
                tenantId,
                templateId: t.id,
                version: 1,
                bodyContent: data.bodyContent
            }
        });

        return t;
    });

    revalidatePath('/contracts/templates');
    return { success: true, id: template.id };
}

export async function fetchTemplates() {
    const tenantId = await getStrictTenantId();
    return prisma.documentTemplate.findMany({
        where: { tenantId },
        include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
        orderBy: { updatedAt: 'desc' }
    });
}
