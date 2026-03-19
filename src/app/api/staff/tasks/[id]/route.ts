import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
    try {
        const resolvedParams = await params;
        const { id } = resolvedParams;
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

        // --- UPDATE STAFF STATUS LOGIC ---
        // If task was completed or cancelled, check if they have any other active tasks
        if (data.status === 'Tamamlandı' || data.status === 'İptal') {
            const pendingTasks = await prisma.staffTask.findMany({
                where: {
                    staffId: task.staffId,
                    status: { notIn: ['Tamamlandı', 'İptal'] }
                },
                orderBy: { createdAt: 'desc' },
                take: 1
            });

            if (pendingTasks.length > 0) {
                // Assign them to the next pending task
                await prisma.staff.update({
                    where: { id: task.staffId },
                    data: { currentJob: pendingTasks[0].title, status: 'Meşgul' }
                });
            } else {
                // Free the staff
                await prisma.staff.update({
                    where: { id: task.staffId },
                    data: { currentJob: null, status: 'Müsait' }
                });
            }
        } else if (data.status === 'Devam Ediyor' || data.status === 'Bekliyor') {
            // Ensure they are marked as busy since the task is active
            await prisma.staff.update({
                where: { id: task.staffId },
                data: { currentJob: task.title, status: 'Meşgul' }
            });
        }
        // ---------------------------------

        return NextResponse.json(task);
    } catch (error) {
        console.error('Error updating task:', error);
        return NextResponse.json({ error: 'Etkinlik güncellenirken hata oluştu' }, { status: 500 });
    }
}
