import { AppEvent } from "../types";
import { WorkflowTaskType, WorkflowTaskPriority } from "@prisma/client";
import { createWorkflowTask } from "@/services/workflow/tasks";

export async function handleWorkflowEvent(event: AppEvent) {
    if (!event.tenantId) return;

    // Helper to map events to Task fields
    let taskType: WorkflowTaskType | null = null;
    let priority: WorkflowTaskPriority = "MEDIUM";
    let title = "";
    let description = "";

    switch (event.type) {
        case "RECONCILIATION_DISPUTED":
            taskType = "RECON_DISPUTE";
            priority = "HIGH";
            title = "Mutabakat İtirazı";
            description = `${event.relatedEntityType || "Müşteri"} tarafından mutabakata itiraz edildi.`;
            break;
        case "SIGNATURE_REJECTED":
            taskType = "SIGNATURE_REJECTED";
            priority = "HIGH";
            title = "İmza Reddedildi";
            description = `Zarf #${event.relatedEntityId?.substring(event.relatedEntityId.length - 8).toUpperCase()} üzerinde reddedilme işlemi var.`;
            break;
        case "SIGNATURE_COMPLETED":
            taskType = "SIGNATURE_REVIEW";
            priority = "LOW";
            title = "İmza Tamamlandı";
            description = `Zarf #${event.relatedEntityId?.substring(event.relatedEntityId.length - 8).toUpperCase()} tüm taraflarca imzalandı. Kontrol gerekiyorsa inceleyin.`;
            break;
        case "MAIL_FAILED":
            taskType = "MAIL_FAILURE";
            priority = "MEDIUM";
            title = "E-Posta Gönderim Hatası";
            description = `${event.meta?.to || "Hedef"} adresine e-posta ulaştırılamadı.`;
            break;
        case "OTP_FAILED":
            taskType = "OTP_FAILURE";
            priority = "MEDIUM";
            title = "SMS OTP Gönderim Hatası";
            description = `${event.meta?.phone || "Numara"} telefona OTP gönderimi başarısız oldu.`;
            break;
        case "TASK_CREATED":
            return;
    }

    if (taskType) {
        try {
            await createWorkflowTask({
                tenantId: event.tenantId,
                companyId: event.companyId,
                type: taskType,
                priority,
                title: event.title || title,
                description: event.message || description,
                relatedEntityType: event.relatedEntityType,
                relatedEntityId: event.relatedEntityId,
                metaJson: event.meta || {}
            });
        } catch (e) {
            console.error(`[WORKFLOW_HANDLER] Failed to create task for event ${event.type}:`, e);
        }
    }
}
