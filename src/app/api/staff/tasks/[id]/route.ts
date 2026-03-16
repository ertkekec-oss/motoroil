import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const data = await req.json();

        // Optional permission check/tenant verification could be added here
        
        let updateData: any = {};
        if (data.status) {
            updateData.status = data.status;
            if (data.status === 'Tamamlandı') {
                updateData.completedAt = new Date();
            }
        }
        if (data.priority) updateData.priority = data.priority;
        if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
        if (data.description !== undefined) updateData.description = data.description;
        
        const task = await prisma.staffTask.update({
            where: { id },
            data: updateData
        });

        // Add feedback comment if provided
        if (data.feedbackContent) {
            await prisma.staffTaskFeedback.create({
                data: {
                    taskId: id,
                    tenantId: task.tenantId, // Use task's tenant
                    content: data.feedbackContent,
                    isFromStaff: data.isFromStaff || false, // default false because admin is calling this API usually
                }
            });
        }

        return NextResponse.json(task);
    } catch (error) {
        console.error('Error updating task:', error);
        return NextResponse.json({ error: 'Etkinlik güncellenirken hata oluştu' }, { status: 500 });
    }
}
