"use client";

import { useState, useEffect } from 'react';

export default function FinancialAuditContent() {
    const [issues, setIssues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAudit = async () => {
            try {
                const res = await fetch('/api/financials/audit');
                const data = await res.json();
                if (data.success) {
                    setIssues(data.issues);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAudit();
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'critical': return '⛔';
            case 'warning': return '⚠️';
            case 'info': return 'ℹ️';
            default: return '❓';
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'critical': return 'border-l-4 border-l-red-500 bg-red-500/5';
            case 'warning': return 'border-l-4 border-l-amber-500 bg-amber-500/5';
            case 'info': return 'border-l-4 border-l-blue-500 bg-blue-500/5';
            default: return 'border-l-4 border-l-gray-500';
        }
    };

    return (
        <div className="animate-fade-in-up">
            <div className="card glass mb-6">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-500">
                        🕵️‍♂️ Akıllı Denetçi (Audit)
                    </h2>
                    <p className="text-muted text-sm mt-1">
                        Yapay zeka desekli kural motoru ile muhasebe kayıtlarındaki olası hataları ve riskleri tarar.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-20 space-y-4">
                    <div className="loading loading-spinner loading-lg text-primary"></div>
                    <p className="text-gray-400 animate-pulse">Kayıtlar taranıyor...</p>
                </div>
            ) : issues.length === 0 ? (
                <div className="card glass p-12 text-center text-green-400 animate-in zoom-in">
                    <div className="text-6xl mb-4">🛡️</div>
                    <h3 className="text-2xl font-bold">Harika! Hiçbir Sorun Bulunamadı.</h3>
                    <p className="text-gray-400 mt-2">Tüm kayıtlarınız yasal mevzuata ve muhasebe standartlarına uygun görünüyor.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {issues.map((issue, idx) => (
                        <div key={idx} className={`pricing-card p-4 rounded-lg flex items-start gap-4 ${getColor(issue.type)} border border-white/5`}>
                            <div className="text-2xl mt-1">{getIcon(issue.type)}</div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-white text-lg">{issue.title}</h4>
                                    <span className="text-xs font-mono text-gray-500 bg-black/30 px-2 py-1 rounded">
                                        {new Date(issue.date).toLocaleDateString()} - Fiş: {issue.fisNo}
                                    </span>
                                </div>
                                <p className="text-gray-300 text-sm mt-1">{issue.description}</p>
                                <div className="mt-2 flex gap-3 text-xs">
                                    <span className="text-gray-500 font-bold uppercase tracking-wider">{issue.category}</span>
                                    {issue.account !== '-' && (
                                        <span className="text-blue-400 font-mono">{issue.account}</span>
                                    )}
                                </div>
                            </div>
                            <button className="btn btn-sm btn-ghost self-center text-gray-400 hover:text-white">İncele</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
