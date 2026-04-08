import { NextResponse } from 'next/dist/server/web/spec-extension/response';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const sessionResult: any = await getSession();
        const session = sessionResult?.user || sessionResult;

        if (!session || (session.role !== 'SUPER_ADMIN' && session.tenantId !== 'PLATFORM_ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { pageId, blocks, publish } = body;

        if (!pageId || !Array.isArray(blocks)) {
            return NextResponse.json({ error: 'Invalid Payload' }, { status: 400 });
        }

        // Run transaction
        await prisma.$transaction(async (tx) => {
            // Upsert all blocks
            for (let i = 0; i < blocks.length; i++) {
                const b = blocks[i];
                if (b.id && b.id.startsWith("temp-")) {
                     // Create new block
                     await tx.cmsBlock.create({
                         data: {
                             pageId: pageId,
                             type: b.type,
                             content: b.content,
                             order: i,
                             isActive: b.isActive
                         }
                     });
                } else {
                     // Update existing
                     await tx.cmsBlock.update({
                         where: { id: b.id },
                         data: {
                             content: b.content,
                             order: i,
                             isActive: b.isActive
                         }
                     });
                }
            }

            // Update page status & create revision if publish selected
            if (publish) {
                const page = await tx.cmsPageV2.update({
                    where: { id: pageId },
                    data: {
                        status: 'PUBLISHED',
                        publishedAt: new Date(),
                        publishedBy: session.id,
                        version: { increment: 1 }
                    },
                    include: { blocks: true }
                });

                // Create snapshot revision
                await tx.cmsRevision.create({
                    data: {
                        pageId: page.id,
                        version: page.version,
                        snapshot: page as any,
                        authorId: session.id,
                        commitMsg: 'Published via Editor'
                    }
                });
            } else {
               await tx.cmsPageV2.update({
                    where: { id: pageId },
                    data: { updatedAt: new Date() }
                });
            }
        });

        return NextResponse.json({ success: true, message: 'Saved successfully' });
    } catch (e) {
        console.error("CMS Save Error:", e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
