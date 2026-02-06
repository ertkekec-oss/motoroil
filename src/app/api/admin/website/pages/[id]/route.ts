
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// Update Page or Upsert Sections
export async function PATCH(req: Request, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const session: any = await getSession();
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.role?.toUpperCase())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await paramsPromise;

    try {
        const body = await req.json();
        const { title, slug, isActive, sections } = body;

        // Update Page Metadata
        const page = await (prisma as any).cmsPage.update({
            where: { id },
            data: { title, slug, isActive }
        });

        // Handle Sections (Sync)
        if (sections && Array.isArray(sections)) {
            // Delete sections not in the new list if they have IDs
            const sectionIds = sections.map((s: any) => s.id).filter(Boolean);
            await (prisma as any).cmsSection.deleteMany({
                where: {
                    pageId: id,
                    id: { notIn: sectionIds }
                }
            });

            // Upsert remaining sections
            for (const section of sections) {
                if (section.id) {
                    await (prisma as any).cmsSection.update({
                        where: { id: section.id },
                        data: {
                            type: section.type,
                            order: section.order,
                            content: section.content || {},
                            isActive: section.isActive
                        }
                    });
                } else {
                    await (prisma as any).cmsSection.create({
                        data: {
                            pageId: id,
                            type: section.type,
                            order: section.order,
                            content: section.content || {},
                            isActive: section.isActive
                        }
                    });
                }
            }
        }

        return NextResponse.json({ success: true, page });
    } catch (error) {
        console.error('CMS PAGE PATCH Error:', error);
        return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const session: any = await getSession();
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.role?.toUpperCase())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await paramsPromise;
        await (prisma as any).cmsPage.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 });
    }
}
