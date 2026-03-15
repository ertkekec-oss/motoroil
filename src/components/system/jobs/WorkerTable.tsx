"use client";

import { useEffect, useState } from 'react';
import { useModal } from "@/contexts/ModalContext";

export function WorkerTable() {
    const { showSuccess, showError, showWarning } = useModal();
    const [workers, setWorkers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/system/workers/health')
            .then(res => res.json())
            .then(data => {
                setWorkers(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const purgeZombies = async () => {
        await fetch('/api/admin/system/workers/health', { method: 'POST' });
        showSuccess("Bilgi", 'Zombie workers purged');
        window.location.reload();
    };

    if (loading) return <div>Yükleniyor...</div>;

    return (
        <div className="bg-white border shadow-sm rounded-xl overflow-hidden p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Distributed Worker Havuzu</h2>
                    <p className="text-sm text-gray-500 mt-1">Sistemdeki aktif event loop dinleyicileri.</p>
                </div>
                <button onClick={purgeZombies} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors">
                    Zombi Süreçleri Temizle
                </button>
            </div>

            <div className="space-y-3">
                {workers?.map((w: any) => {
                    const isAlive = new Date(w.lastHeartbeatAt).getTime() > Date.now() - 300000;
                    return (
                        <div key={w.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                            <div>
                                <p className="font-semibold text-gray-800 flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${isAlive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    {w.workerName}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Kuyruk: <span className="font-mono">{w.queueName}</span> | Host: {w.hostInfo || 'DOCKER_MOCK'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-slate-700">{isAlive ? 'ACTIVE' : 'ZOMBIE (ÖLÜ)'}</p>
                                <p className="text-[10px] text-gray-400 mt-1">Son Sinyal: {new Date(w.lastHeartbeatAt).toLocaleTimeString()}</p>
                            </div>
                        </div>
                    );
                })}

                {workers.length === 0 && (
                    <p className="text-center text-gray-400 py-4 text-sm">Aktif kayıtlı sanal worker bulunamadı.</p>
                )}
            </div>
        </div>
    );
}
