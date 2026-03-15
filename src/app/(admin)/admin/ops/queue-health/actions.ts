"use server";

import { performQueueAction } from "@/services/ops/queueMetrics";
import { revalidatePath } from "next/cache";

export async function handleQueueAction(qName: string, action: 'pause' | 'resume' | 'drain') {
    await performQueueAction(qName, action);
    revalidatePath('/admin/ops/queue-health');
}
