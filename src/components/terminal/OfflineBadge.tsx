import React, { useEffect, useState } from 'react';
import { useOfflineDetector, getQueue } from '@/lib/pos-offline';

export default function OfflineBadge() {
    const { isOnline } = useOfflineDetector();
    const [queueSize, setQueueSize] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            const q = getQueue();
            const pending = q.filter(item => item.status === 'pending' || item.status === 'failed');
            setQueueSize(pending.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    if (isOnline && queueSize === 0) return null;

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${isOnline ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-600 border-red-200 dark:border-red-500/20'}`}>
            <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnline ? 'bg-amber-400' : 'bg-red-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-amber-500' : 'bg-red-500'}`}></span>
            </span>
            {isOnline ? `Online (Senkronize Ediliyor: ${queueSize})` : `Offline (Bekleyen İşlem: ${queueSize})`}
        </div>
    );
}
