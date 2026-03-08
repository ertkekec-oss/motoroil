"use client";

import { useEffect, useState } from 'react';

export function SystemJobsBoard() {
    const [jobs, setJobs] = useState<any[]>([]);
    const [deadLetters, setDeadLetters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        Promise.all([
            fetch('/api/admin/system/jobs').then(res => res.json()),
            fetch('/api/admin/system/jobs/dead-letter').then(res => res.json())
        ]).then(([jobsData, dlq]) => {
            setJobs(jobsData || []);
            setDeadLetters(dlq || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [refreshTrigger]);

    const handleRetry = async (jobId: string) => {
        await fetch(`/api/admin/system/jobs/${jobId}/retry`, { method: 'POST' });
        setRefreshTrigger(prev => prev + 1);
    };

    const handleDLQRequeue = async (deadLetterId: string) => {
        await fetch('/api/admin/system/jobs/dead-letter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deadLetterId })
        });
        setRefreshTrigger(prev => prev + 1);
    };

    if (loading) return <div>Yükleniyor...</div>;

    return (
        <div className="space-y-6">
            {/* Dead Letter Panel */}
            {deadLetters.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <h3 className="text-red-800 font-bold mb-3 flex items-center gap-2">Karantina Bildirimi (Dead Letter Queue)</h3>
                    <p className="text-sm text-red-600 mb-4 font-medium leading-relaxed max-w-2xl bg-white bg-opacity-50 p-3 rounded-lg border border-red-100 shadow-sm">
                        Sistem max-retry değerini doldurmuş ancak hala başarıya ulaşamamış {deadLetters.length} adet bozuk job tespit etti.
                        Lütfen sebebini inceleyin ve ardından sisteme geri alın.
                    </p>

                    <div className="space-y-2">
                        {deadLetters?.map(dl => (
                            <div key={dl.id} className="flex justify-between items-center bg-white border border-red-100 p-4 rounded-lg shadow-sm">
                                <div>
                                    <span className="font-semibold text-gray-800 tracking-tight">{dl.jobType}</span>
                                    <p className="text-xs text-gray-500 font-mono mt-1">Hata: {dl.errorMessage}</p>
                                </div>
                                <button
                                    onClick={() => handleDLQRequeue(dl.id)}
                                    className="w-32 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm whitespace-nowrap"
                                >
                                    Re-Queue Job
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Job List Panel */}
            <div className="bg-white border shadow-sm rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-gray-900">Son Arka Plan İşleri (Recent Distributed Jobs)</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 text-gray-600 border-y">
                            <tr>
                                <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs">Tür / Scope</th>
                                <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs">Kuyruk (Queue)</th>
                                <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs">Durum</th>
                                <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs text-right">Zamanlama</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-gray-700">
                            {jobs?.map(job => (
                                <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <p className="font-bold text-slate-800">{job.jobType}</p>
                                        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">{job.moduleScope}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-md font-mono border border-blue-100">
                                            {job.queueName}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2.5 py-1 rounded-md font-bold tracking-wide border 
                                             ${job.status === 'SUCCEEDED' ? 'bg-green-50 text-green-700 border-green-200' :
                                                job.status === 'RUNNING' ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse' :
                                                    job.status === 'FAILED' ? 'bg-red-50 text-red-700 border-red-200' :
                                                        job.status === 'DEAD_LETTER' ? 'bg-gray-800 text-red-400 border-gray-900' :
                                                            'bg-gray-100 text-gray-700 border-gray-200'}`}
                                        >
                                            {job.status}
                                        </span>
                                        {job.status === 'FAILED' && (
                                            <button onClick={() => handleRetry(job.id)} className="ml-3 text-blue-600 hover:text-blue-800 font-medium underline">
                                                Zorla Tekrar Dene
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className="text-gray-500 font-mono text-xs">{new Date(job.createdAt).toLocaleString()}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {jobs.length === 0 && (
                        <div className="text-center py-6 text-gray-400">Arka plan görevi bulunamadı.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
