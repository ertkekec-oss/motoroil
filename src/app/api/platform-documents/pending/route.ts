import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const tenantId = session.companyId || (session as any).tenantId;
        const { searchParams } = new URL(req.url);
        const targetModule = searchParams.get('module') as any;

        if (!targetModule) {
            return NextResponse.json({ pending: [] });
        }

        // Fetch all ACTIVE documents for this module
        const activeDocs = await prisma.platformDocument.findMany({
            where: {
                targetModule,
                isActive: true
            }
        });

        if (activeDocs.length === 0) {
            return NextResponse.json({ pending: [] });
        }

        // Fetch approvals for this tenant across these active docs
        const docIds = activeDocs.map(d => d.id);
        const existingApprovals = await prisma.tenantDocumentApproval.findMany({
            where: {
                tenantId,
                documentId: { in: docIds }
            }
        });

        const pendingDocs = [];

        for (const doc of activeDocs) {
            // Document is pending if there's NO approval that matches the current version
            const hasApprovedCurrentVersion = existingApprovals.some(
                a => a.documentId === doc.id && a.documentVersion === doc.version
            );

            if (!hasApprovedCurrentVersion) {
                pendingDocs.push({
                    id: doc.id,
                    documentNo: doc.documentNo,
                    title: doc.title,
                    contentType: doc.contentType,
                    fileKey: doc.fileKey,
                    textContent: doc.textContent,
                    version: doc.version,
                    approvalMethod: doc.approvalMethod,
                    category: doc.category
                });
            }
        }

        return NextResponse.json({ pending: pendingDocs });
    } catch (error: any) {
        console.error('[Platform Docs Check Error]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
