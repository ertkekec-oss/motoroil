import { TicketPriority, TicketStatus } from '@prisma/client';

export function calculateSlaDueAt(priority: TicketPriority, createdAt: Date): Date {
    const dueTime = new Date(createdAt);

    switch (priority) {
        case 'CRITICAL':
            dueTime.setHours(dueTime.getHours() + 12);
            break;
        case 'HIGH':
            dueTime.setHours(dueTime.getHours() + 24);
            break;
        case 'MEDIUM':
            dueTime.setHours(dueTime.getHours() + 48);
            break;
        case 'LOW':
        default:
            dueTime.setHours(dueTime.getHours() + 72);
            break;
    }

    return dueTime;
}
