import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateContractFromTemplate } from '@/services/contracts/templateEngine';
import { enqueueRenderPdf } from '@/services/contracts/jobs';
import { ContractActorType, ContractAuditAction } from '@prisma/client';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { tenantId, templateVersionId, sourceSystemContext } = body;

        if (!tenantId || !templateVersionId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { document, docVersion } = await generateContractFromTemplate(tenantId, templateVersionId, sourceSystemContext);

        await prisma.contractAuditEvent.create({
            data: {
                tenantId,
                action: ContractAuditAction.CONTRACT_GENERATED,
                actorType: ContractActorType.SYSTEM,
                meta: { documentId: document.id, templateVersionId }
            }
        });

        // Trigger PDF rendering asynchronously
        await enqueueRenderPdf(docVersion.id);

        return NextResponse.json({ success: true, documentId: document.id, docVersionId: docVersion.id });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
