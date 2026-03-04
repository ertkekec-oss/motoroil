import { getQueue, updateQueueItemStatus, removeQueueItem } from './queue';

export async function syncQueue(processSaleFn: (payload: any) => Promise<boolean>) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    const queue = getQueue();
    const pending = queue.filter(q => q.status === 'pending' || q.status === 'failed');

    for (const item of pending) {
        try {
            updateQueueItemStatus(item.id, 'syncing');
            const success = await processSaleFn(item.payload);
            if (success) {
                removeQueueItem(item.id);
            } else {
                updateQueueItemStatus(item.id, 'failed');
            }
        } catch (e) {
            updateQueueItemStatus(item.id, 'failed');
            console.error("Sync failed for", item.id, e);
        }
    }
}
