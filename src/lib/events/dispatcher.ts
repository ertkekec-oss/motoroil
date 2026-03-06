import { AppEvent } from "./types";
import { handleNotificationEvent } from "./handlers/notification-handler";
import { handleWorkflowEvent } from "./handlers/workflow-handler";

type EventHandler = (event: AppEvent) => Promise<void>;

class EventDispatcher {
    private handlers: Record<string, EventHandler[]> = {};

    constructor() {
        // V1 Defaults
        this.register('SIGNATURE_INVITATION_SENT', handleNotificationEvent);
        this.register('SIGNATURE_COMPLETED', handleNotificationEvent);
        this.register('SIGNATURE_REJECTED', handleNotificationEvent);
        this.register('DISPUTE_RESOLVED', handleNotificationEvent);
        this.register('OTP_FAILED', handleNotificationEvent);
        this.register('MAIL_FAILED', handleNotificationEvent);
        this.register('TASK_CREATED', handleNotificationEvent);

        // Workflow Defaults
        this.register('RECONCILIATION_DISPUTED', handleWorkflowEvent);
        this.register('SIGNATURE_REJECTED', handleWorkflowEvent);
        this.register('SIGNATURE_COMPLETED', handleWorkflowEvent);
        this.register('MAIL_FAILED', handleWorkflowEvent);
        this.register('OTP_FAILED', handleWorkflowEvent);
    }

    register(eventType: string, handler: EventHandler) {
        if (!this.handlers[eventType]) {
            this.handlers[eventType] = [];
        }
        this.handlers[eventType].push(handler);
    }

    async publish(event: AppEvent) {
        console.log(`[EVENT_BUS] Publishing event: ${event.type}`, event.relatedEntityId ? `for ${event.relatedEntityType}:${event.relatedEntityId}` : '');

        const eventHandlers = this.handlers[event.type] || [];

        // Asynchronously execute all handlers so it doesn't block the main thread
        Promise.allSettled(eventHandlers.map(handler => handler(event)))
            .then(results => {
                results.forEach((res, i) => {
                    if (res.status === 'rejected') {
                        console.error(`[EVENT_BUS] Handler ${i} failed for ${event.type}:`, res.reason);
                    }
                });
            });
    }
}

export const eventBus = new EventDispatcher();

export function publishEvent(event: AppEvent) {
    return eventBus.publish(event);
}
