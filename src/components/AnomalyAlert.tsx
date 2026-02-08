
"use client";

import { useState, useEffect } from 'react';

export default function AnomalyAlert() {
    const [anomalies, setAnomalies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAnomalies = async () => {
            try {
                const res = await fetch('/api/security/anomalies');
                const json = await res.json();
                if (json.anomalies) {
                    setAnomalies(json.anomalies);
                }
            } catch (error) {
                console.error("Anomaly Alert Error", error);
            } finally {
                setLoading(false);
            }
        };
        checkAnomalies();
    }, []);

    if (loading || anomalies.length === 0) return null;

    return (
        <div className="bg-red-900/20 border border-red-500/20 rounded-2xl p-4 mb-4 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl animate-pulse">🚨</span>
                <h3 className="text-lg font-bold text-red-400">Güvenlik Anomalisi Tespit Edildi</h3>
            </div>

            <div className="space-y-3">
                {anomalies.map((alert, idx) => (
                    <div key={idx} className="bg-black/30 p-3 rounded-lg border border-red-500/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                        <div>
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${alert.severity === 'HIGH' ? 'bg-red-500 animate-ping' : 'bg-orange-400'}`}></span>
                                {alert.staffName}
                            </div>
                            <div className="text-red-300/80 text-xs mt-1">{alert.description}</div>
                        </div>
                        <div className="flex gap-4 min-w-[200px] justify-end">
                            <div className="text-right">
                                <div className="text-[9px] text-gray-500 uppercase font-bold">DEĞER</div>
                                <div className="text-white font-mono text-sm font-bold">{alert.metric}</div>
                            </div>
                            <div className="w-px bg-white/10 mx-2"></div>
                            <div className="text-right">
                                <div className="text-[9px] text-gray-500 uppercase font-bold">ORTALAMA</div>
                                <div className="text-gray-400 font-mono text-xs">{alert.baseline}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-3 text-right">
                <button className="text-[10px] text-red-500 font-bold hover:underline" onClick={() => window.location.href = '/security/suspicious'}>
                    TÜM DETAYLARI İNCELE →
                </button>
            </div>
        </div>
    );
}
