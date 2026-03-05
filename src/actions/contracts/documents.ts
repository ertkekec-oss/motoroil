"use server";

import { prisma } from '@/lib/prisma';
import { getStrictTenantId } from '@/services/contracts/tenantContext';
import { enqueueRenderPdf } from '@/services/contracts/jobs';
import { appendAuditEvent } from '@/services/contracts/audit';
import { revalidatePath } from 'next/cache';

export async function createDocumentFromTemplate(templateVersionId: string, subject: string) {
    const tenantId = await getStrictTenantId();

    const tv = await prisma.templateVersion.findFirst({
        where: { id: templateVersionId, tenantId }
    });
    if (!tv) throw new Error("Template version not found");

    const doc = await prisma.$transaction(async (tx) => {
        const _doc = await tx.document.create({
            data: {
                tenantId,
                subject,
                source: 'TEMPLATE',
                status: 'DRAFT',
                templateVersionId: tv.id
            }
        });

        const _ver = await tx.documentVersion.create({
            data: {
                tenantId,
                documentId: _doc.id,
                version: 1,
                bodySnapshot: tv.bodyContent
            }
        });

        return { doc: _doc, ver: _ver };
    });

    await appendAuditEvent({
        tenantId,
        actorType: 'USER',
        action: 'CREATED',
        meta: { documentId: doc.doc.id, source: 'TEMPLATE' }
    });

    // TODO PROMPT 02: Real PDF render job integration
    await enqueueRenderPdf(doc.ver.id);

    revalidatePath('/contracts/documents');
    return { success: true, documentId: doc.doc.id };
}

export async function fetchDocuments() {
    const tenantId = await getStrictTenantId();
    return prisma.document.findMany({
        where: { tenantId },
        include: { versions: { orderBy: { version: 'desc' }, take: 1 }, templateVersion: { include: { template: true } } },
        orderBy: { updatedAt: 'desc' }
    });
}
