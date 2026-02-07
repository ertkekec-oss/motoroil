
import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
    tenantId: string;
    userId: string;
    role: string;
    isSuperAdmin: boolean;
}

export const requestStorage = new AsyncLocalStorage<RequestContext>();

export function getRequestContext() {
    return requestStorage.getStore();
}
