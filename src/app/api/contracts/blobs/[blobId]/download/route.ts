import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStrictTenantId } from '@/services/contracts/tenantContext';
import { getObject } from '@/services/storage/objectStorage';
import { ContractAuditAction, ContractActorType } from '@prisma/client';

export async function GET(req: Request, { params }: { params: Promise<{ blobId: string }> }) {
    try {
        const tenantId = await getStrictTenantId();

        const blob = await prisma.fileBlob.findUnique({
            where: { id: (await params).blobId }
        });

        if (!blob || blob.tenantId !== tenantId) return NextResponse.json({ error: "File not found" }, { status: 404 });

        // Storage interaction
        const objectBodyStr = await getObject(blob.s3Key);

        // MVP logic: Since objectBodyStr is a Readable stream in Node
        let buffer = Buffer.from([]);

        // This handles older readable streams vs modern web responses. Using standard arrayBuffer here for Node v18+ response handling
        if (typeof objectBodyStr.transformToByteArray === "function") {
            const byteArray = await objectBodyStr.transformToByteArray();
            buffer = Buffer.from(byteArray);
        }

        // Audit Download
        await prisma.contractAuditEvent.create({
            data: {
                tenantId,
                actorType: ContractActorType.USER,
                action: ContractAuditAction.DOWNLOADED,
                meta: { blobId: blob.id }
            }
        });

        // Ensure we send binary payload
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': blob.fileType,
                'Content-Disposition': `inline; filename="document_${blob.id}.pdf"`
            }
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
