import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
    try {
        const resolvedParams = await params;
        const { id } = resolvedParams;
        const task = await prisma.staffTask.findUnique({
            where: { id }
        });

        if (!task) {
            return NextResponse.json({ error: 'Görev bulunamadı' }, { status: 404 });
        }

        const data = await req.json();

        // Admin might change status simultaneously
        if (data.status) {
            await prisma.staffTask.update({
                where: { id },
                data: { status: data.status, completedAt: data.status === 'Tamamlandı' ? new Date() : undefined }
            });
        }

        const feedback = await prisma.staffTaskFeedback.create({
            data: {
                taskId: id,
                tenantId: task.tenantId,
                content: data.content,
                isFromStaff: !!data.isFromStaff,
                fileKey: data.fileKey || null,
                fileName: data.fileName || null
            }
        });

        return NextResponse.json(feedback);
    } catch (error) {
        console.error('Error creating feedback:', error);
        return NextResponse.json({ error: 'Geri bildirim eklenirken hata' }, { status: 500 });
    }
}
