"use client";

import { useEffect, useState } from 'react';

interface ReliabilityScore {
    currentLevel: number;
    explanation: {
        title: string;
        score: number;
        summaryText: string;
        keyMetrics: Array<{ label: string, value: string | number }>;
        recommendation: string;
    };
    updatedAt: string;
    trend: 'POSITIVE' | 'CRITICAL' | 'NEUTRAL';
}

export function OperationalReliabilityCard() {
    const [score, setScore] = useState<ReliabilityScore | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/network/shipping/reliability')
            .then(res => res.json())
            .then(data => {
                if (data && data.explanation) {
                    setScore(data as ReliabilityScore);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div>Yükleniyor...</div>;

    if (!score) return (
        <div className="rounded-xl border shadow-sm p-4">
            <h3 className="font-semibold text-lg pb-2 border-b mb-4">Operasyonel Güvenilirlik</h3>
            <p className="text-sm">Henüz yeterli kargo ve teslimat verisi toplanmadı.</p>
        </div>
    );

    const isHigh = score.currentLevel >= 80;

    return (
        <div className="rounded-xl border shadow-sm bg-white p-4">
            <div className="flex flex-row items-center justify-between pb-2 border-b mb-4">
                <h3 className="font-semibold text-lg">{score.explanation.title}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${isHigh ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    Skor: {score.currentLevel.toFixed(1)} / 100
                </span>
            </div>
            <div className="space-y-4">
                <p className="text-sm text-gray-500">
                    {score.explanation.summaryText}
                </p>

                <div className="grid grid-cols-2 gap-4">
                    {score.explanation.keyMetrics?.map((m, i) => (
                        <div key={i} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                            <p className="text-xs text-gray-500">{m.label}</p>
                            <p className="text-lg font-semibold">{m.value}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-3 rounded-md text-sm leading-relaxed">
                    <strong>Öneri:</strong> {score.explanation.recommendation}
                </div>

                <p className="text-xs text-gray-400">Son Güncelleme: {new Date(score.updatedAt).toLocaleString()}</p>
            </div>
        </div>
    );
}
