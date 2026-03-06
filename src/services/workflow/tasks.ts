"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { WorkflowTaskType, WorkflowTaskStatus, WorkflowTaskPriority, Prisma } from "@prisma/client";
import { publishEvent } from "@/lib/events";

export async function createWorkflowTask(data: {
    tenantId: string;
    companyId?: string;
    type: WorkflowTaskType;
    title: string;
    description: string;
    priority?: WorkflowTaskPriority;
    assigneeId?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    metaJson?: any;
    dueAt?: Date;
}) {
    try {
        const task = await prisma.workflowTask.create({
            data: {
                tenantId: data.tenantId,
                companyId: data.companyId,
                type: data.type,
                title: data.title,
                description: data.description,
                priority: data.priority || "MEDIUM",
                assigneeId: data.assigneeId,
                relatedEntityType: data.relatedEntityType,
                relatedEntityId: data.relatedEntityId,
                metaJson: data.metaJson || Prisma.DbNull,
                dueAt: data.dueAt,
                status: "OPEN"
            }
        });

        // Publish event for task created
        publishEvent({
            type: "TASK_CREATED" as any,
            tenantId: task.tenantId,
            companyId: task.companyId || undefined,
            title: "Yeni Görev Oluşturuldu",
            message: `${task.title} adlı yeni bir görev ataması yapıldı.`,
            meta: {
                taskId: task.id,
                title: task.title,
                type: task.type,
                priority: task.priority
            }
        }).catch(e => console.error("Failed to publish task created event:", e));

        return { success: true, task };
    } catch (e: any) {
        console.error("Task creation failed:", e);
        return { success: false, error: e.message };
    }
}

export async function assignWorkflowTask(taskId: string, userId: string) {
    try {
        const session: any = await getSession();
        if (!session || !session.tenantId) throw new Error("Unauthorized");

        const task = await prisma.workflowTask.update({
            where: { id: taskId, tenantId: session.tenantId },
            data: { assigneeId: userId }
        });

        return { success: true, task };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function updateWorkflowTaskStatus(taskId: string, status: WorkflowTaskStatus) {
    try {
        const session: any = await getSession();
        if (!session || !session.tenantId) throw new Error("Unauthorized");

        const data: any = { status };
        if (status === "COMPLETED") data.completedAt = new Date();
        else data.completedAt = null;

        const task = await prisma.workflowTask.update({
            where: { id: taskId, tenantId: session.tenantId },
            data
        });

        return { success: true, task };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function completeWorkflowTask(taskId: string) {
    return updateWorkflowTaskStatus(taskId, "COMPLETED");
}

export async function listWorkflowTasks(filters?: {
    status?: WorkflowTaskStatus | WorkflowTaskStatus[];
    priority?: WorkflowTaskPriority;
    type?: WorkflowTaskType;
    assigneeId?: string;
    limit?: number;
}) {
    try {
        const session: any = await getSession();
        if (!session || !session.tenantId) throw new Error("Unauthorized");

        const where: Prisma.WorkflowTaskWhereInput = { tenantId: session.tenantId };

        if (filters?.status) {
            where.status = Array.isArray(filters.status) ? { in: filters.status } : filters.status;
        }
        if (filters?.priority) where.priority = filters.priority;
        if (filters?.type) where.type = filters.type;
        if (filters?.assigneeId) where.assigneeId = filters.assigneeId;

        const tasks = await prisma.workflowTask.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: filters?.limit || 100
        });

        return { success: true, tasks };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
