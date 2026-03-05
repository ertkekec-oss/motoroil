import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStrictTenantId } from '@/services/contracts/tenantContext';
import { enqueueRenderPdf } from '@/services/contracts/jobs';
import { ContractAuditAction, ContractActorType } from '@prisma/client';

export async function POST(req: Request, { params }: { params: { documentId: string } }) {
    try {
        const tenantId = await getStrictTenantId();

        // Find latest version or specified. Assuming latest.
        const d = await prisma.document.findUnique({
            where: { id: params.documentId },
            include: { versions: { orderBy: { version: 'desc' }, take: 1 } }
        });

        if (!d || d.tenantId !== tenantId) return NextResponse.json({ error: "Document not found" }, { status: 404 });
        if (d.versions.length === 0) return NextResponse.json({ error: "No versions present" }, { status: 400 });

        const latestVersion = d.versions[0];
        const latestVersionId = latestVersion.id;

        // Idempotency check 
        if (latestVersion.renderStatus === 'RENDERING' || latestVersion.renderStatus === 'COMPLETED' || !!latestVersion.fileBlobId) {
            return NextResponse.json({ success: true, message: "Already rendered or currently rendering", status: latestVersion.renderStatus });
        }

        // Set status to RENDERING explicitly
        await prisma.documentVersion.update({
            where: { id: latestVersionId },
            data: { renderStatus: 'RENDERING' }
        });

        await prisma.contractAuditEvent.create({
            data: {
                tenantId,
                actorType: ContractActorType.USER,
                action: ContractAuditAction.PDF_RENDER_QUEUED,
                meta: { documentId: d.id, versionId: latestVersionId }
            }
        });

        await enqueueRenderPdf(latestVersionId);

        return NextResponse.json({ success: true, jobId: `render_pdf:${latestVersionId}`, status: "queued", documentVersionId: latestVersionId });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
