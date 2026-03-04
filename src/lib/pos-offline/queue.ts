export interface QueuedSale {
    id: string;
    type: string;
    payload: any;
    createdAt: number;
    status: 'pending' | 'syncing' | 'failed' | 'done';
}

const QUEUE_KEY = 'pos_offline_queue';

export function getQueue(): QueuedSale[] {
    try {
        const data = localStorage.getItem(QUEUE_KEY);
        if (data) return JSON.parse(data);
    } catch (e) { }
    return [];
}

export function addToQueue(type: string, payload: any): QueuedSale {
    const queue = getQueue();
    const item: QueuedSale = {
        id: Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9),
        type,
        payload,
        createdAt: Date.now(),
        status: 'pending'
    };
    queue.push(item);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return item;
}

export function updateQueueItemStatus(id: string, status: QueuedSale['status']) {
    let queue = getQueue();
    const item = queue.find(q => q.id === id);
    if (item) {
        item.status = status;
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    }
}

export function removeQueueItem(id: string) {
    let queue = getQueue();
    queue = queue.filter(q => q.id !== id);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}
