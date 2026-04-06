import React from 'react';

export default function AdminGlobalLoading() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 p-4 md:p-8 font-sans w-full">
            <div className="max-w-[1600px] mx-auto space-y-6">
                
                {/* Skeleton Header */}
                <div className="border-b border-slate-200 dark:border-white/10 pb-6 flex justify-between items-center">
                    <div className="space-y-4">
                        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                        <div className="h-4 w-96 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                    </div>
                </div>

                {/* Skeleton Cards Map */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4">
                            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                            <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                        </div>
                    ))}
                </div>

                {/* Skeleton Table Block */}
                <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-6 mt-8">
                    <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-6"></div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-12 w-full bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse"></div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
